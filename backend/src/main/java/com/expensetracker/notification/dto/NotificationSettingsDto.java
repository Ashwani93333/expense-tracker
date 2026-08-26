package com.expensetracker.notification.dto;

import com.expensetracker.model.UserNotificationSettings;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class NotificationSettingsDto {

    private UUID userId;
    private Boolean inAppNotifications;
    private Boolean emailNotifications;
    private Boolean overallBudgetEnabled;
    private List<Integer> overallBudgetThresholds;
    private String overallBudgetThresholdType;
    private Boolean categoryBudgetEnabled;
    private List<Integer> categoryBudgetThresholds;
    private String categoryBudgetThresholdType;
    private Boolean totalExpenditureEnabled;
    private List<Integer> totalExpenditureThresholds;
    private String totalExpenditureThresholdType;
    private Boolean monthlySummaryEnabled;
    private Boolean budgetUpdateEnabled;
    private Boolean expiryDateUpdateEnabled;
    private Boolean paymentApprovalEnabled;
    private OffsetDateTime updatedAt;

    public static NotificationSettingsDto fromEntity(UserNotificationSettings s) {
        NotificationSettingsDto dto = new NotificationSettingsDto();
        dto.setUserId(s.getUser().getId());
        dto.setInAppNotifications(s.getInAppNotifications());
        dto.setEmailNotifications(s.getEmailNotifications());
        dto.setOverallBudgetEnabled(s.getOverallBudgetEnabled());
        dto.setOverallBudgetThresholds(s.getOverallBudgetThresholds());
        dto.setOverallBudgetThresholdType(s.getOverallBudgetThresholdType());
        dto.setCategoryBudgetEnabled(s.getCategoryBudgetEnabled());
        dto.setCategoryBudgetThresholds(s.getCategoryBudgetThresholds());
        dto.setCategoryBudgetThresholdType(s.getCategoryBudgetThresholdType());
        dto.setTotalExpenditureEnabled(s.getTotalExpenditureEnabled());
        dto.setTotalExpenditureThresholds(s.getTotalExpenditureThresholds());
        dto.setTotalExpenditureThresholdType(s.getTotalExpenditureThresholdType());
        dto.setMonthlySummaryEnabled(s.getMonthlySummaryEnabled());
        dto.setBudgetUpdateEnabled(s.getBudgetUpdateEnabled());
        dto.setExpiryDateUpdateEnabled(s.getExpiryDateUpdateEnabled());
        dto.setPaymentApprovalEnabled(s.getPaymentApprovalEnabled());
        dto.setUpdatedAt(s.getUpdatedAt());
        return dto;
    }

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
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
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
