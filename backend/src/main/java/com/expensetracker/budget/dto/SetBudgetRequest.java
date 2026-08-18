package com.expensetracker.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class SetBudgetRequest {

    @NotNull(message = "Budget limit is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    private BigDecimal budgetLimit;

    /** Optional: null = overall budget, non-null = per-category budget */
    private UUID categoryId;

    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
}
