package com.expensetracker.model;

import com.expensetracker.model.converter.IntegerListJsonConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Per-user notification preferences. Exactly one row per user (enforced by a
 * UNIQUE constraint on user_id). Threshold lists are JSON arrays stored in TEXT.
 */
@Entity
@Table(name = "user_notification_settings", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_notification_settings_user", columnNames = "user_id")
})
public class UserNotificationSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "in_app_notifications")
    private Boolean inAppNotifications = true;

    @Column(name = "email_notifications")
    private Boolean emailNotifications = true;

    @Column(name = "overall_budget_enabled")
    private Boolean overallBudgetEnabled = true;

    @Convert(converter = IntegerListJsonConverter.class)
    @Column(name = "overall_budget_thresholds", columnDefinition = "TEXT")
    private List<Integer> overallBudgetThresholds = defaultThresholds();

    @Column(name = "category_budget_enabled")
    private Boolean categoryBudgetEnabled = true;

    @Convert(converter = IntegerListJsonConverter.class)
    @Column(name = "category_budget_thresholds", columnDefinition = "TEXT")
    private List<Integer> categoryBudgetThresholds = defaultThresholds();

    @Column(name = "total_expenditure_enabled")
    private Boolean totalExpenditureEnabled = false;

    @Convert(converter = IntegerListJsonConverter.class)
    @Column(name = "total_expenditure_thresholds", columnDefinition = "TEXT")
    private List<Integer> totalExpenditureThresholds = new ArrayList<>();

    @Column(name = "overall_budget_threshold_type", length = 10)
    private String overallBudgetThresholdType = "PERCENTAGE";

    @Column(name = "category_budget_threshold_type", length = 10)
    private String categoryBudgetThresholdType = "PERCENTAGE";

    @Column(name = "total_expenditure_threshold_type", length = 10)
    private String totalExpenditureThresholdType = "AMOUNT";

    @Column(name = "monthly_summary_enabled")
    private Boolean monthlySummaryEnabled = false;

    @Column(name = "budget_update_enabled")
    private Boolean budgetUpdateEnabled = true;

    @Column(name = "expiry_date_update_enabled")
    private Boolean expiryDateUpdateEnabled = true;

    @Column(name = "payment_approval_enabled")
    private Boolean paymentApprovalEnabled = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public UserNotificationSettings() {}

    private static List<Integer> defaultThresholds() {
        return new ArrayList<>(List.of(80, 100));
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Boolean getInAppNotifications() { return inAppNotifications; }
    public void setInAppNotifications(Boolean inAppNotifications) { this.inAppNotifications = inAppNotifications; }
    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public Boolean getOverallBudgetEnabled() { return overallBudgetEnabled; }
    public void setOverallBudgetEnabled(Boolean overallBudgetEnabled) { this.overallBudgetEnabled = overallBudgetEnabled; }
    public List<Integer> getOverallBudgetThresholds() { return overallBudgetThresholds; }
    public void setOverallBudgetThresholds(List<Integer> overallBudgetThresholds) { this.overallBudgetThresholds = overallBudgetThresholds; }
    public Boolean getCategoryBudgetEnabled() { return categoryBudgetEnabled; }
    public void setCategoryBudgetEnabled(Boolean categoryBudgetEnabled) { this.categoryBudgetEnabled = categoryBudgetEnabled; }
    public List<Integer> getCategoryBudgetThresholds() { return categoryBudgetThresholds; }
    public void setCategoryBudgetThresholds(List<Integer> categoryBudgetThresholds) { this.categoryBudgetThresholds = categoryBudgetThresholds; }
    public Boolean getTotalExpenditureEnabled() { return totalExpenditureEnabled; }
    public void setTotalExpenditureEnabled(Boolean totalExpenditureEnabled) { this.totalExpenditureEnabled = totalExpenditureEnabled; }
    public List<Integer> getTotalExpenditureThresholds() { return totalExpenditureThresholds; }
    public void setTotalExpenditureThresholds(List<Integer> totalExpenditureThresholds) { this.totalExpenditureThresholds = totalExpenditureThresholds; }
    public String getOverallBudgetThresholdType() { return overallBudgetThresholdType; }
    public void setOverallBudgetThresholdType(String overallBudgetThresholdType) { this.overallBudgetThresholdType = overallBudgetThresholdType; }
    public String getCategoryBudgetThresholdType() { return categoryBudgetThresholdType; }
    public void setCategoryBudgetThresholdType(String categoryBudgetThresholdType) { this.categoryBudgetThresholdType = categoryBudgetThresholdType; }
    public String getTotalExpenditureThresholdType() { return totalExpenditureThresholdType; }
    public void setTotalExpenditureThresholdType(String totalExpenditureThresholdType) { this.totalExpenditureThresholdType = totalExpenditureThresholdType; }
    public Boolean getMonthlySummaryEnabled() { return monthlySummaryEnabled; }
    public void setMonthlySummaryEnabled(Boolean monthlySummaryEnabled) { this.monthlySummaryEnabled = monthlySummaryEnabled; }
    public Boolean getBudgetUpdateEnabled() { return budgetUpdateEnabled; }
    public void setBudgetUpdateEnabled(Boolean budgetUpdateEnabled) { this.budgetUpdateEnabled = budgetUpdateEnabled; }
    public Boolean getExpiryDateUpdateEnabled() { return expiryDateUpdateEnabled; }
    public void setExpiryDateUpdateEnabled(Boolean expiryDateUpdateEnabled) { this.expiryDateUpdateEnabled = expiryDateUpdateEnabled; }
    public Boolean getPaymentApprovalEnabled() { return paymentApprovalEnabled; }
    public void setPaymentApprovalEnabled(Boolean paymentApprovalEnabled) { this.paymentApprovalEnabled = paymentApprovalEnabled; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }

    public boolean isInAppEnabled() {
        return Boolean.TRUE.equals(inAppNotifications);
    }

    public boolean isEmailEnabled() {
        return Boolean.TRUE.equals(emailNotifications);
    }

    public boolean isOverallBudgetEnabled() {
        return Boolean.TRUE.equals(overallBudgetEnabled);
    }

    public boolean isCategoryBudgetEnabled() {
        return Boolean.TRUE.equals(categoryBudgetEnabled);
    }

    public boolean isTotalExpenditureEnabled() {
        return Boolean.TRUE.equals(totalExpenditureEnabled);
    }

    public boolean isMonthlySummaryEnabled() {
        return Boolean.TRUE.equals(monthlySummaryEnabled);
    }

    public boolean isBudgetUpdateEnabled() {
        return Boolean.TRUE.equals(budgetUpdateEnabled);
    }

    public boolean isExpiryDateUpdateEnabled() {
        return Boolean.TRUE.equals(expiryDateUpdateEnabled);
    }

    public boolean isPaymentApprovalEnabled() {
        return Boolean.TRUE.equals(paymentApprovalEnabled);
    }
}
