package com.expensetracker.report;

import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.GroupMemberRepository;
import com.expensetracker.repository.UserRepository;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Policy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.test.context.ActiveProfiles;

import java.time.Duration;
import java.time.LocalDate;
import java.util.UUID;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Verifies the caching contract for the group report aggregate:
 *
 * <ol>
 *   <li>a repeated read for the same (group, range) is served from the cache
 *       rather than recomputed;</li>
 *   <li>distinct date ranges do not collide;</li>
 *   <li>the configured TTL is actually applied to the backing Caffeine cache;</li>
 *   <li>group membership is re-checked on <em>every</em> call, including calls
 *       that hit the cache — a user removed from a group must lose access
 *       immediately rather than after the TTL expires.</li>
 * </ol>
 *
 * <p>The h2 profile sets {@code app.cache.enabled=false}, so caching is switched
 * back on explicitly here. Caches are process-wide and are cleared per test; the
 * membership test builds its own throwaway group so it cannot affect the others.
 */
@SpringBootTest(properties = {
        "app.cache.enabled=true",
        "app.cache.ttl-seconds=45",
        "app.cache.max-entries=500"
})
@ActiveProfiles("h2")
class GroupReportCacheIntegrationTest {

    @Autowired
    private GroupReportCache reportCache;

    @Autowired
    private GroupReportService reportService;

    @Autowired
    private CacheManager cacheManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseGroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    private UUID groupId;
    private LocalDate start;
    private LocalDate end;

    @BeforeEach
    void setUp() {
        start = LocalDate.now().withDayOfMonth(1);
        end = start.withDayOfMonth(start.lengthOfMonth());
        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
    }

    @Test
    void secondReadForSameGroupAndRangeIsServedFromCache() {
        var first = reportCache.monthlyReport(newGroup(), start, end);
        var second = reportCache.monthlyReport(groupId, start, end);

        // Identical instance => served from the cache rather than recomputed.
        assertThat(second).isSameAs(first);
    }

    @Test
    void distinctRangesDoNotCollide() {
        UUID id = newGroup();
        var march = reportCache.monthlyReport(id, LocalDate.of(2026, 3, 1), LocalDate.of(2026, 3, 31));
        var april = reportCache.monthlyReport(id, LocalDate.of(2026, 4, 1), LocalDate.of(2026, 4, 30));

        assertThat(april).isNotSameAs(march);
    }

    @Test
    void configuredTtlIsAppliedToBackingCache() {
        reportCache.monthlyReport(newGroup(), start, end);

        Policy<Object, Object> policy = nativeCache("groupMonthlyReport").policy();
        assertThat(policy.expireAfterWrite()).isPresent();
        assertThat(policy.expireAfterWrite().orElseThrow().getExpiresAfter(TimeUnit.NANOSECONDS))
                .isEqualTo(Duration.ofSeconds(45).toNanos());
    }

    @Test
    void membershipIsRecheckedEvenWhenTheAggregateIsCached() {
        User member = newUser("member");
        UUID id = newGroup();
        addActiveMember(id, member);

        // Warm the cache as a legitimate member.
        assertThat(reportService.getMonthlyReport(member.getId(), id, monthParam(), null, null, null)).isNotNull();

        // Removing the member must take effect on the very next call, even though
        // the aggregate for this group and range is now cached.
        GroupMember gm = groupMemberRepository.findByGroupIdAndUserId(id, member.getId()).orElseThrow();
        gm.setStatus("REMOVED");
        groupMemberRepository.save(gm);

        assertThatThrownBy(() ->
                reportService.getMonthlyReport(member.getId(), id, monthParam(), null, null, null))
                .isInstanceOf(AccessDeniedException.class);

        // A user who was never a member is refused as well.
        User outsider = newUser("outsider");
        assertThatThrownBy(() ->
                reportService.getMonthlyReport(outsider.getId(), id, monthParam(), null, null, null))
                .isInstanceOf(AccessDeniedException.class);
    }

    // --- helpers ---

    /** Creates a fresh group with no members; the id lands in {@link #groupId}. */
    private UUID newGroup() {
        ExpenseGroup group = new ExpenseGroup();
        group.setName("Cache Test Group");
        group.setCreatedBy(newUser("owner"));
        group.setInviteCode(UUID.randomUUID().toString().substring(0, 12));
        groupId = groupRepository.save(group).getId();
        return groupId;
    }

    private void addActiveMember(UUID id, User user) {
        GroupMember gm = new GroupMember();
        gm.setGroup(groupRepository.findById(id).orElseThrow());
        gm.setUser(user);
        gm.setRole("ADMIN");
        gm.setStatus("ACTIVE");
        groupMemberRepository.save(gm);
    }

    private String monthParam() {
        return String.format("%d-%02d", start.getYear(), start.getMonthValue());
    }

    @SuppressWarnings("unchecked")
    private Cache<Object, Object> nativeCache(String name) {
        return ((CaffeineCache) cacheManager.getCache(name)).getNativeCache();
    }

    private User newUser(String prefix) {
        User u = new User();
        u.setFullName(prefix + " user");
        u.setEmail(prefix + "-" + UUID.randomUUID() + "@example.com");
        u.setPasswordHash("not-a-real-hash");
        return userRepository.save(u);
    }
}
