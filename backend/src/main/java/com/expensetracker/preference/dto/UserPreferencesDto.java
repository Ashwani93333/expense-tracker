package com.expensetracker.preference.dto;

import com.expensetracker.model.IncomeSlab;
import com.expensetracker.model.User;
import com.expensetracker.model.UserPreferences;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class UserPreferencesDto {

    private UUID id;
    private String incomeSlab;
    private String incomeSlabLabel;
    private BigDecimal suggestedMonthlyBudget;
    private String expensePreference;
    private List<UUID> selectedCategoryIds;
    private Boolean onboardingCompleted;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static UserPreferencesDto fromEntity(UserPreferences prefs, User user) {
        UserPreferencesDto dto = new UserPreferencesDto();
        dto.setId(prefs.getId());
        dto.setIncomeSlab(prefs.getIncomeSlab());
        dto.setExpensePreference(prefs.getExpensePreference());
        dto.setSelectedCategoryIds(prefs.getSelectedCategoryIds());
        dto.setOnboardingCompleted(user != null ? user.getOnboardingCompleted() : null);
        dto.setCreatedAt(prefs.getCreatedAt());
        dto.setUpdatedAt(prefs.getUpdatedAt());

        if (prefs.getIncomeSlab() != null) {
            try {
                IncomeSlab slab = IncomeSlab.valueOf(prefs.getIncomeSlab());
                dto.setIncomeSlabLabel(slab.getLabel());
                dto.setSuggestedMonthlyBudget(slab.getSuggestedMonthlyBudget());
            } catch (IllegalArgumentException ignored) {
                dto.setIncomeSlabLabel(prefs.getIncomeSlab());
            }
        }
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getIncomeSlab() { return incomeSlab; }
    public void setIncomeSlab(String incomeSlab) { this.incomeSlab = incomeSlab; }
    public String getIncomeSlabLabel() { return incomeSlabLabel; }
    public void setIncomeSlabLabel(String incomeSlabLabel) { this.incomeSlabLabel = incomeSlabLabel; }
    public BigDecimal getSuggestedMonthlyBudget() { return suggestedMonthlyBudget; }
    public void setSuggestedMonthlyBudget(BigDecimal suggestedMonthlyBudget) { this.suggestedMonthlyBudget = suggestedMonthlyBudget; }
    public String getExpensePreference() { return expensePreference; }
    public void setExpensePreference(String expensePreference) { this.expensePreference = expensePreference; }
    public List<UUID> getSelectedCategoryIds() { return selectedCategoryIds; }
    public void setSelectedCategoryIds(List<UUID> selectedCategoryIds) { this.selectedCategoryIds = selectedCategoryIds; }
    public Boolean getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}