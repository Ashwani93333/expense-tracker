package com.expensetracker.report.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class GroupAnalyticsDto {
    private UUID groupId;
    private String groupName;
    private LocalDate month;
    private List<Map<String, Object>> categoryBreakdown;
    private List<Map<String, Object>> dailyTrend;      // [{date, amount}]
    private List<Map<String, Object>> topSpenders;     // [{userId, userName, spent, pctOfTotal}]
    private BigDecimal totalSpent;

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public List<Map<String, Object>> getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(List<Map<String, Object>> categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    public List<Map<String, Object>> getDailyTrend() { return dailyTrend; }
    public void setDailyTrend(List<Map<String, Object>> dailyTrend) { this.dailyTrend = dailyTrend; }
    public List<Map<String, Object>> getTopSpenders() { return topSpenders; }
    public void setTopSpenders(List<Map<String, Object>> topSpenders) { this.topSpenders = topSpenders; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
}
