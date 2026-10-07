package com.expensetracker.budget;

import com.expensetracker.budget.dto.*;
import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.*;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.notification.NotificationSettingsService;
import com.expensetracker.repository.*;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
public class GroupBudgetService {

    private final GroupBudgetRepository groupBudgetRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationSettingsService notificationSettingsService;
    private final GroupBudgetCache budgetCache;
    private final com.expensetracker.group.GroupRoleGuard roleGuard;

    public GroupBudgetService(
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseGroupRepository groupRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            NotificationSettingsService notificationSettingsService,
            GroupBudgetCache budgetCache,
            com.expensetracker.group.GroupRoleGuard roleGuard) {
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.notificationSettingsService = notificationSettingsService;
        this.budgetCache = budgetCache;
        this.roleGuard = roleGuard;
    }

    // Budget writes must be visible to the very next read: the response itself is
    // uncached, and these evictions make the client's follow-up status refetch
    // (triggered after the PUT) see the new figures instead of the TTL-held ones.
    @Caching(evict = {
            @CacheEvict(cacheNames = "groupBudgetStatus", allEntries = true),
            @CacheEvict(cacheNames = "groupMemberBudgets", allEntries = true)
    })
    @Transactional
    public GroupBudgetStatusResponse setGroupBudget(User admin, UUID groupId, BigDecimal totalBudget,
                                                    String splitType, List<BudgetMemberSplit> memberBudgets,
                                                    String monthParam) {
        roleGuard.requirePermission(groupId, admin.getId(),
                com.expensetracker.group.GroupPermission.SET_BUDGET);

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        LocalDate month = BudgetService.parseMonth(monthParam);

        // Caps are slices of the group total: a custom split may never add up to
        // more than the budget it divides.
        if (SPLIT_CUSTOM.equals(normalizeSplitType(splitType)) && memberBudgets != null) {
            List<GroupMember> activeMembers = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
            BigDecimal allocated = memberBudgets.stream()
                    .filter(s -> s.getUserId() != null && s.getBudgetLimit() != null)
                    .filter(s -> activeMembers.stream()
                            .anyMatch(gm -> gm.getUser().getId().equals(s.getUserId())))
                    .map(BudgetMemberSplit::getBudgetLimit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            if (allocated.compareTo(totalBudget) > 0) {
                throw new BadRequestException(
                        "Member caps total ₹" + allocated + " which exceeds the group budget of ₹"
                                + totalBudget + ". Reduce the caps so they fit within the budget.");
            }
        }

        GroupBudget budget = groupBudgetRepository.findByGroupIdAndMonth(groupId, month)
                .orElse(new GroupBudget());
        budget.setGroup(group);
        budget.setMonth(month);
        budget.setTotalBudget(totalBudget);
        budget.setSetBy(admin);
        groupBudgetRepository.save(budget);

        // Derive per-member caps from the group total (EQUAL auto-splits the total
        // evenly; CUSTOM persists the admin-supplied allocations).
        List<GroupMember> activeMembers = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
        applyMemberSplit(group, activeMembers, month, totalBudget, splitType, memberBudgets, admin);

        // Notify all members based on their notification settings
        activeMembers.forEach(gm -> {
            var settings = notificationSettingsService.getSettings(gm.getUser().getId());
            boolean inAppEnabled = settings.getInAppNotifications() && settings.getBudgetUpdateEnabled();
            boolean emailEnabled = settings.getEmailNotifications() && settings.getBudgetUpdateEnabled();
            if (inAppEnabled || emailEnabled) {
                String title = "Group budget updated";
                String message = "The budget for '" + group.getName() + "' has been set to ₹" + totalBudget;
                notificationService.dispatchNotification(
                        gm.getUser(), inAppEnabled, emailEnabled,
                        "BUDGET_UPDATED", title, message,
                        group.getId(), "GROUP");
            }
        });

        // Uncached on purpose: this response must reflect the budget just written.
        return budgetCache.freshBudgetStatus(groupId, month, month);
    }

    /**
     * Membership is re-checked on every call, before the cache is consulted, so a
     * cache hit can never serve budget figures to a user who has since left the
     * group.
     */
    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse getGroupBudgetStatus(User user, UUID groupId, String monthParam,
                                                          String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return budgetCache.budgetStatus(groupId, range[0], range[1]);
    }

    @Caching(evict = {
            @CacheEvict(cacheNames = "groupBudgetStatus", allEntries = true),
            @CacheEvict(cacheNames = "groupMemberBudgets", allEntries = true)
    })
    @Transactional
    public MemberBudgetDto setMemberBudget(User admin, UUID groupId, UUID targetUserId,
                                            BigDecimal budgetLimit, String monthParam) {
        roleGuard.requirePermission(groupId, admin.getId(),
                com.expensetracker.group.GroupPermission.SET_MEMBER_CAPS);

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        // Target must be an active member
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, targetUserId, "ACTIVE");
        if (!isMember) throw new AccessDeniedException("Target user is not an active member of this group");

        LocalDate month = BudgetService.parseMonth(monthParam);

        // The sum of all member caps may not exceed the group budget for the month.
        GroupBudget groupBudget = groupBudgetRepository.findByGroupIdAndMonth(groupId, month).orElse(null);
        if (groupBudget != null) {
            BigDecimal others = memberBudgetRepository.findByGroupIdAndMonth(groupId, month).stream()
                    .filter(mb -> !mb.getUser().getId().equals(targetUserId))
                    .map(GroupMemberBudget::getBudgetLimit)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal newTotal = others.add(budgetLimit);
            if (newTotal.compareTo(groupBudget.getTotalBudget()) > 0) {
                throw new BadRequestException(
                        "Caps would total ₹" + newTotal + " which exceeds the group budget of ₹"
                                + groupBudget.getTotalBudget() + ". Reduce this cap or the group budget.");
            }
        }

        GroupMemberBudget memberBudget = memberBudgetRepository
                .findByGroupIdAndUserIdAndMonth(groupId, targetUserId, month)
                .orElse(new GroupMemberBudget());
        memberBudget.setGroup(group);
        memberBudget.setUser(targetUser);
        memberBudget.setMonth(month);
        memberBudget.setBudgetLimit(budgetLimit);
        memberBudget.setSetBy(admin);
        GroupMemberBudget saved = memberBudgetRepository.save(memberBudget);

        return budgetCache.memberBudgetView(saved, groupId, month);
    }

    @Transactional(readOnly = true)
    public List<MemberBudgetDto> getMemberBudgets(User user, UUID groupId, String monthParam,
                                                  String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return budgetCache.memberBudgets(groupId, range[0], range[1]);
    }

    // --- private helpers ---

    private static final String SPLIT_EQUAL = "EQUAL";
    private static final String SPLIT_CUSTOM = "CUSTOM";

    /** Writes each active member's cap for the month, per the EQUAL or CUSTOM strategy. */
    private void applyMemberSplit(ExpenseGroup group, List<GroupMember> activeMembers, LocalDate month,
                                  BigDecimal totalBudget, String splitType, List<BudgetMemberSplit> customSplits,
                                  User admin) {
        if (activeMembers.isEmpty()) {
            return;
        }
        if (SPLIT_CUSTOM.equals(normalizeSplitType(splitType))) {
            if (customSplits == null || customSplits.isEmpty()) {
                return; // admin will assign per-member caps manually afterwards
            }
            for (BudgetMemberSplit s : customSplits) {
                if (s.getUserId() == null || s.getBudgetLimit() == null) {
                    continue;
                }
                boolean isActiveMember = activeMembers.stream()
                        .anyMatch(gm -> gm.getUser().getId().equals(s.getUserId()));
                if (!isActiveMember) {
                    continue;
                }
                User member = userRepository.findById(s.getUserId()).orElse(null);
                if (member == null) {
                    continue;
                }
                upsertMemberBudget(group, member, month, s.getBudgetLimit(), admin);
            }
            return;
        }

        // EQUAL: total split evenly; last member absorbs the rounding remainder so
        // the caps always sum exactly to the group total.
        int n = activeMembers.size();
        BigDecimal base = totalBudget.divide(BigDecimal.valueOf(n), 2, RoundingMode.HALF_UP);
        for (int i = 0; i < n; i++) {
            GroupMember gm = activeMembers.get(i);
            BigDecimal cap = (i == n - 1)
                    ? totalBudget.subtract(base.multiply(BigDecimal.valueOf(n - 1)))
                    : base;
            upsertMemberBudget(group, gm.getUser(), month, cap, admin);
        }
    }

    private void upsertMemberBudget(ExpenseGroup group, User member, LocalDate month,
                                    BigDecimal cap, User admin) {
        GroupMemberBudget mb = memberBudgetRepository
                .findByGroupIdAndUserIdAndMonth(group.getId(), member.getId(), month)
                .orElse(new GroupMemberBudget());
        mb.setGroup(group);
        mb.setUser(member);
        mb.setMonth(month);
        mb.setBudgetLimit(cap);
        mb.setSetBy(admin);
        memberBudgetRepository.save(mb);
    }

    private String normalizeSplitType(String splitType) {
        if (splitType == null || splitType.isBlank()) {
            return SPLIT_EQUAL;
        }
        String t = splitType.trim().toUpperCase();
        return SPLIT_CUSTOM.equals(t) ? SPLIT_CUSTOM : SPLIT_EQUAL;
    }

    private void requireMember(UUID groupId, UUID userId) {
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "ACTIVE");
        if (!isMember) throw new AccessDeniedException("You are not a member of this group");
    }
}
