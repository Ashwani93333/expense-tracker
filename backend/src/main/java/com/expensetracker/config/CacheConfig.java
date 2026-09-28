package com.expensetracker.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.cache.support.NoOpCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

/**
 * Cache wiring for the expensive, group-scoped read aggregates (monthly report,
 * analytics, group budget status, member budgets).
 *
 * <p>Staleness policy: these aggregates are derived from six tables
 * ({@code expenses}, {@code expense_splits}, {@code group_budgets},
 * {@code group_member_budgets}, {@code group_members}, {@code users}) and are read
 * on every dashboard load. Rather than hand-maintaining an exhaustive
 * {@code @CacheEvict} fan-out across all six write paths — which silently rots the
 * first time a new write path is added — correctness is delegated to a short
 * time-to-live. A group report that is up to {@code app.cache.ttl-seconds} old is
 * acceptable; a permanently stale one is not, and a missed eviction self-heals
 * within one TTL window instead of persisting for the life of the process.
 *
 * <p>Access control is deliberately kept <em>outside</em> the cached methods. The
 * cached entries are keyed by group and date range only, so membership is
 * re-checked on every call by the delegating services; see
 * {@code GroupReportService} and {@code GroupBudgetService}.
 *
 * <p>Set {@code app.cache.enabled=false} to make every {@code @Cacheable} method a
 * pass-through. The h2 test profile does this so integration tests always observe
 * freshly committed state.
 */
@Configuration
public class CacheConfig {

    /**
     * Cache names must match the {@code cacheNames} referenced by the
     * {@code @Cacheable} methods. They are declared up front so that a typo in a
     * {@code cacheNames} attribute fails fast at startup rather than silently
     * creating a dynamically-named cache with no TTL bound.
     */
    static final String MONTHLY_REPORT = "groupMonthlyReport";
    static final String ANALYTICS = "groupAnalytics";
    static final String BUDGET_STATUS = "groupBudgetStatus";
    static final String MEMBER_BUDGETS = "groupMemberBudgets";

    @Configuration
    @ConditionalOnProperty(prefix = "app.cache", name = "enabled", havingValue = "true", matchIfMissing = true)
    static class CaffeineCacheConfiguration {

        @Bean
        public CacheManager cacheManager(
                @Value("${app.cache.ttl-seconds:30}") long ttlSeconds,
                @Value("${app.cache.max-entries:1000}") long maxEntries) {

            CaffeineCacheManager cacheManager = new CaffeineCacheManager();
            cacheManager.setCaffeine(Caffeine.newBuilder()
                    .expireAfterWrite(Duration.ofSeconds(ttlSeconds))
                    .maximumSize(maxEntries));

            // Static registration only: an unknown cache name is then a hard error
            // instead of an unbounded, never-expiring cache.
            cacheManager.setCacheNames(java.util.List.of(
                    MONTHLY_REPORT, ANALYTICS, BUDGET_STATUS, MEMBER_BUDGETS));
            cacheManager.setAllowNullValues(false);

            return cacheManager;
        }
    }

    @Configuration
    @ConditionalOnProperty(prefix = "app.cache", name = "enabled", havingValue = "false")
    static class DisabledCacheConfiguration {

        @Bean
        public CacheManager cacheManager() {
            return new NoOpCacheManager();
        }
    }
}
