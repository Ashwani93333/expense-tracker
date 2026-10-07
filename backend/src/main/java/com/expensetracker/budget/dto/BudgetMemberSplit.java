package com.expensetracker.budget.dto;

import java.math.BigDecimal;
import java.util.UUID;

/** One member's allocated budget cap for a CUSTOM group-budget split. */
public class BudgetMemberSplit {

    private UUID userId;
    private BigDecimal budgetLimit;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }
}