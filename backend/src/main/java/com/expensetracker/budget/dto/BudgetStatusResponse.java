package com.expensetracker.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class BudgetStatusResponse {
    private UUID budgetId;
    private LocalDate month;
    private BigDecimal budgetLimit;
    private BigDecimal spent;
    private BigDecimal remaining;
    private Double percentUsed;
    private String status; // OK | WARNING | EXCEEDED
    private UUID categoryId;
    private String categoryName;

    public static BudgetStatusResponse of(
            UUID budgetId, LocalDate month, BigDecimal limit, BigDecimal spent,
            UUID categoryId, String categoryName) {
        BudgetStatusResponse r = new BudgetStatusResponse();
        r.setBudgetId(budgetId);
        r.setMonth(month);
        r.setBudgetLimit(limit);
        r.setSpent(spent);
        r.setRemaining(limit.subtract(spent));
        double pct = limit.compareTo(BigDecimal.ZERO) == 0 ? 0.0 :
                spent.doubleValue() / limit.doubleValue() * 100.0;
        r.setPercentUsed(Math.round(pct * 10.0) / 10.0);
        r.setStatus(pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "OK");
        r.setCategoryId(categoryId);
        r.setCategoryName(categoryName);
        return r;
    }

    public UUID getBudgetId() { return budgetId; }
    public void setBudgetId(UUID budgetId) { this.budgetId = budgetId; }
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
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
}
