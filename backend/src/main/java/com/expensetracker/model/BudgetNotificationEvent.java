package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Idempotency ledger for budget threshold notifications.
 * One row per (user, budget/category/group, month, threshold, type).
 * The UNIQUE constraint on dedupKey is the concurrency-safe source of truth
 * that prevents duplicate threshold notifications.
 */
@Entity
@Table(name = "budget_notification_events", uniqueConstraints = {
        @UniqueConstraint(name = "uk_budget_notification_event_dedup", columnNames = "dedup_key")
})
public class BudgetNotificationEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** For personal budgets this is the user_budgets row id. */
    @Column(name = "budget_id")
    private UUID budgetId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "group_id")
    private UUID groupId;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "threshold", nullable = false)
    private Integer threshold;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @Column(name = "dedup_key", nullable = false, length = 255)
    private String dedupKey;

    @CreationTimestamp
    @Column(name = "triggered_at", updatable = false)
    private OffsetDateTime triggeredAt;

    public BudgetNotificationEvent() {}

    public static String buildDedupKey(UUID userId, UUID budgetId, UUID categoryId, UUID groupId,
                                       LocalDate month, int threshold, String notificationType) {
        return month + "|" + threshold + "|" + notificationType + "|" + userId
                + "|" + nvl(budgetId) + "|" + nvl(categoryId) + "|" + nvl(groupId);
    }

    private static String nvl(UUID v) {
        return v == null ? "-" : v.toString();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public UUID getBudgetId() { return budgetId; }
    public void setBudgetId(UUID budgetId) { this.budgetId = budgetId; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public Integer getThreshold() { return threshold; }
    public void setThreshold(Integer threshold) { this.threshold = threshold; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public String getDedupKey() { return dedupKey; }
    public void setDedupKey(String dedupKey) { this.dedupKey = dedupKey; }
    public OffsetDateTime getTriggeredAt() { return triggeredAt; }
    public void setTriggeredAt(OffsetDateTime triggeredAt) { this.triggeredAt = triggeredAt; }
}
