package com.expensetracker.notification.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Partial-update request for a user's notification preferences. Any field that is
 * left out (or null) keeps its current value. Thresholds are validated to be
 * between 1 and 100, de-duplicated and sorted by the service.
 */
public class UpdateNotificationSettingsRequest {

    private Boolean inAppNotifications;
    private Boolean emailNotifications;
    private Boolean overallBudgetEnabled;

    @Size(max = 20, message = "Too many overall budget thresholds")
    private List<@Min(value = 1, message = "Threshold must be between 1 and 100") @Max(value = 100, message = "Threshold must be between 1 and 100") Integer> overallBudgetThresholds;

    private String overallBudgetThresholdType;

    private Boolean categoryBudgetEnabled;

    @Size(max = 20, message = "Too many category budget thresholds")
    private List<@Min(value = 1, message = "Threshold must be between 1 and 100") @Max(value = 100, message = "Threshold must be between 1 and 100") Integer> categoryBudgetThresholds;

    private String categoryBudgetThresholdType;

    private Boolean totalExpenditureEnabled;

    @Size(max = 20, message = "Too many total expenditure thresholds")
    private List<@Min(value = 1, message = "Threshold must be a positive amount") Integer> totalExpenditureThresholds;

    private String totalExpenditureThresholdType;

    private Boolean monthlySummaryEnabled;
    private Boolean budgetUpdateEnabled;
    private Boolean expiryDateUpdateEnabled;
    private Boolean paymentApprovalEnabled;

    public Boolean getInAppNotifications() { return inAppNotifications; }
    public void setInAppNotifications(Boolean inAppNotifications) { this.inAppNotifications = inAppNotifications; }
    public Boolean getEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(Boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public Boolean getOverallBudgetEnabled() { return overallBudgetEnabled; }
    public void setOverallBudgetEnabled(Boolean overallBudgetEnabled) { this.overallBudgetEnabled = overallBudgetEnabled; }
    public List<Integer> getOverallBudgetThresholds() { return overallBudgetThresholds; }
    public void setOverallBudgetThresholds(List<Integer> overallBudgetThresholds) { this.overallBudgetThresholds = overallBudgetThresholds; }
    public String getOverallBudgetThresholdType() { return overallBudgetThresholdType; }
    public void setOverallBudgetThresholdType(String overallBudgetThresholdType) { this.overallBudgetThresholdType = overallBudgetThresholdType; }
    public Boolean getCategoryBudgetEnabled() { return categoryBudgetEnabled; }
    public void setCategoryBudgetEnabled(Boolean categoryBudgetEnabled) { this.categoryBudgetEnabled = categoryBudgetEnabled; }
    public List<Integer> getCategoryBudgetThresholds() { return categoryBudgetThresholds; }
    public void setCategoryBudgetThresholds(List<Integer> categoryBudgetThresholds) { this.categoryBudgetThresholds = categoryBudgetThresholds; }
    public String getCategoryBudgetThresholdType() { return categoryBudgetThresholdType; }
    public void setCategoryBudgetThresholdType(String categoryBudgetThresholdType) { this.categoryBudgetThresholdType = categoryBudgetThresholdType; }
    public Boolean getTotalExpenditureEnabled() { return totalExpenditureEnabled; }
    public void setTotalExpenditureEnabled(Boolean totalExpenditureEnabled) { this.totalExpenditureEnabled = totalExpenditureEnabled; }
    public List<Integer> getTotalExpenditureThresholds() { return totalExpenditureThresholds; }
    public void setTotalExpenditureThresholds(List<Integer> totalExpenditureThresholds) { this.totalExpenditureThresholds = totalExpenditureThresholds; }
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
}
