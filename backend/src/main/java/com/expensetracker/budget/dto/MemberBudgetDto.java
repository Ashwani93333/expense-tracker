package com.expensetracker.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class MemberBudgetDto {
    private UUID userId;
    private String userName;
    private LocalDate month;
    private BigDecimal budgetLimit;
    private BigDecimal spent;
    private BigDecimal remaining;
    private Double percentUsed;
    private String status;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }
    public BigDecimal getSpent() { return spent; }
    public void setSpent(BigDecimal spent) { this.spent = spent; }
    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }
    public Double getPercentUsed() { return percentUsed; }
    public void setPercentUsed(Double percentUsed) { this.percentUsed = percentUsed; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
