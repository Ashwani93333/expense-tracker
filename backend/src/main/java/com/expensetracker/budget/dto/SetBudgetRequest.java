package com.expensetracker.budget.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class SetBudgetRequest {

    @NotNull(message = "Budget limit is required")
    @DecimalMin(value = "0.01", message = "Budget must be greater than 0")
    private BigDecimal budgetLimit;

    /** Optional: null = overall budget, non-null = per-category budget */
    private UUID categoryId;

    /**
     * Group budget only. How to derive member caps from the total:
     * EQUAL splits the total evenly across active members, CUSTOM uses
     * {@link #memberBudgets}. Defaults to EQUAL for group budgets.
     */
    private String splitType;

    /** Group budget only (CUSTOM split): per-member budget caps. */
    private List<BudgetMemberSplit> memberBudgets;

    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public String getSplitType() { return splitType; }
    public void setSplitType(String splitType) { this.splitType = splitType; }
    public List<BudgetMemberSplit> getMemberBudgets() { return memberBudgets; }
    public void setMemberBudgets(List<BudgetMemberSplit> memberBudgets) { this.memberBudgets = memberBudgets; }
}