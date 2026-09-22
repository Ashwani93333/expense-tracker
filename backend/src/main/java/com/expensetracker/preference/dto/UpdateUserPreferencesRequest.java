package com.expensetracker.preference.dto;

import java.util.List;
import java.util.UUID;

public class UpdateUserPreferencesRequest {

    private String incomeSlab;
    private String expensePreference;
    private List<UUID> selectedCategoryIds;
    private Boolean onboardingCompleted;

    public String getIncomeSlab() { return incomeSlab; }
    public void setIncomeSlab(String incomeSlab) { this.incomeSlab = incomeSlab; }
    public String getExpensePreference() { return expensePreference; }
    public void setExpensePreference(String expensePreference) { this.expensePreference = expensePreference; }
    public List<UUID> getSelectedCategoryIds() { return selectedCategoryIds; }
    public void setSelectedCategoryIds(List<UUID> selectedCategoryIds) { this.selectedCategoryIds = selectedCategoryIds; }
    public Boolean getOnboardingCompleted() { return onboardingCompleted; }
    public void setOnboardingCompleted(Boolean onboardingCompleted) { this.onboardingCompleted = onboardingCompleted; }
}