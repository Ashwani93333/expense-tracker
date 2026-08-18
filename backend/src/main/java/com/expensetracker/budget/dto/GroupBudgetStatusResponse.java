package com.expensetracker.budget.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class GroupBudgetStatusResponse {
    private UUID groupId;
    private String groupName;
    private LocalDate month;
    private BigDecimal totalBudget;
    private BigDecimal totalSpent;
    private BigDecimal remaining;
    private Double percentUsed;
    private String status;
    private List<MemberBudgetDto> memberBreakdown;

    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
    public BigDecimal getRemaining() { return remaining; }
    public void setRemaining(BigDecimal remaining) { this.remaining = remaining; }
    public Double getPercentUsed() { return percentUsed; }
    public void setPercentUsed(Double percentUsed) { this.percentUsed = percentUsed; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<MemberBudgetDto> getMemberBreakdown() { return memberBreakdown; }
    public void setMemberBreakdown(List<MemberBudgetDto> memberBreakdown) { this.memberBreakdown = memberBreakdown; }
}
