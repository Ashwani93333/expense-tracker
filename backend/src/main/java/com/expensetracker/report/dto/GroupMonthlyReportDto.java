package com.expensetracker.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class GroupMonthlyReportDto {
    private UUID groupId;
    private String groupName;
    private LocalDate month;
    private BigDecimal totalSpent;
    private BigDecimal totalBudget;
    private Double budgetPercentUsed;
    private String budgetStatus;
    private List<Map<String, Object>> categoryBreakdown;
    private List<Map<String, Object>> memberBreakdown;
    private List<Map<String, Object>> topDescriptions;

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }
    public Double getBudgetPercentUsed() { return budgetPercentUsed; }
    public void setBudgetPercentUsed(Double budgetPercentUsed) { this.budgetPercentUsed = budgetPercentUsed; }
    public String getBudgetStatus() { return budgetStatus; }
    public void setBudgetStatus(String budgetStatus) { this.budgetStatus = budgetStatus; }
    public List<Map<String, Object>> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<Map<String, Object>> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    public List<Map<String, Object>> getMemberBreakdown() { return memberBreakdown; }
    public void setMemberBreakdown(List<Map<String, Object>> memberBreakdown) { this.memberBreakdown = memberBreakdown; }
    public List<Map<String, Object>> getTopDescriptions() { return topDescriptions; }
    public void setTopDescriptions(List<Map<String, Object>> topDescriptions) { this.topDescriptions = topDescriptions; }
}
