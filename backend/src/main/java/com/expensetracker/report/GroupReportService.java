package com.expensetracker.report;

import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.*;
import com.expensetracker.report.dto.GroupAnalyticsDto;
import com.expensetracker.report.dto.GroupMonthlyReportDto;
import com.expensetracker.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class GroupReportService {

    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupBudgetRepository groupBudgetRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;

    public GroupReportService(
            ExpenseGroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupBudgetRepository groupBudgetRepository,
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository) {
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupBudgetRepository = groupBudgetRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
    }

    @Transactional(readOnly = true)
    public GroupMonthlyReportDto getMonthlyReport(UUID userId, UUID groupId, String monthParam,
                                                  String year, String dateFrom, String dateTo) {
        requireMember(groupId, userId);
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        LocalDate start = range[0];
        LocalDate end = range[1];

        BigDecimal totalSpent = expenseRepository.sumGroupExpensesForMonth(groupId, start, end);
        BigDecimal totalBudget = sumGroupBudgetOverRange(groupId, start, end);

        // Category breakdown
        List<Object[]> catRows = expenseRepository.categoryBreakdownGroup(groupId, start, end);
        List<Map<String, Object>> categoryBreakdown = catRows.stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("categoryId", row[0] != null ? row[0].toString() : null);
                    m.put("categoryName", row[1] != null ? row[1].toString() : "Uncategorized");
                    m.put("total", row[2]);
                    if (totalSpent.compareTo(BigDecimal.ZERO) != 0) {
                        double pct = ((BigDecimal) row[2]).doubleValue() / totalSpent.doubleValue() * 100;
                        m.put("pctOfTotal", Math.round(pct * 10.0) / 10.0);
                    } else {
                        m.put("pctOfTotal", 0.0);
                    }
                    return m;
                })
                .collect(Collectors.toList());

        // Member breakdown — each member's spend vs their cap
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
        List<Map<String, Object>> memberBreakdown = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal memberSpent = splitRepository.sumMemberShareInGroupForMonth(
                    gm.getUser().getId(), groupId, start, end);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", gm.getUser().getId().toString());
            m.put("userName", gm.getUser().getFullName());
            m.put("spent", memberSpent);
            BigDecimal cap = sumMemberBudgetOverRange(groupId, gm.getUser().getId(), start, end);
            if (cap != null) {
                m.put("budgetLimit", cap);
                double pct = cap.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                        : memberSpent.doubleValue() / cap.doubleValue() * 100;
                m.put("pctUsed", Math.round(pct * 10.0) / 10.0);
            }
            memberBreakdown.add(m);
        }

        // Top expense descriptions (proxy for merchants) — APPROVED only
        List<Expense> expenses = expenseRepository
                .findByGroupIdAndStatusAndExpenseDateBetweenOrderByExpenseDateDesc(
                        groupId, "APPROVED", start, end);
        Map<String, BigDecimal> descTotals = new LinkedHashMap<>();
        for (Expense e : expenses) {
            String desc = e.getDescription() != null ? e.getDescription() : "Unnamed";
            descTotals.merge(desc, e.getAmount(), BigDecimal::add);
        }
        List<Map<String, Object>> topDescriptions = descTotals.entrySet().stream()
                .sorted((a, b) -> b.getValue().compareTo(a.getValue()))
                .limit(5)
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("description", entry.getKey());
                    m.put("total", entry.getValue());
                    return m;
                })
                .collect(Collectors.toList());

        // Calculate budget metrics
        Double budgetPct = null;
        String budgetStatus = "NO_BUDGET";
        if (totalBudget != null && totalBudget.compareTo(BigDecimal.ZERO) != 0) {
            double pct = totalSpent.doubleValue() / totalBudget.doubleValue() * 100;
            budgetPct = Math.round(pct * 10.0) / 10.0;
            budgetStatus = pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "OK";
        }

        GroupMonthlyReportDto dto = new GroupMonthlyReportDto();
        dto.setGroupId(groupId);
        dto.setGroupName(group.getName());
        dto.setMonth(start);
        dto.setTotalSpent(totalSpent);
        dto.setTotalBudget(totalBudget);
        dto.setBudgetPercentUsed(budgetPct);
        dto.setBudgetStatus(budgetStatus);
        dto.setCategoryBreakdown(categoryBreakdown);
        dto.setMemberBreakdown(memberBreakdown);
        dto.setTopDescriptions(topDescriptions);
        return dto;
    }

    @Transactional(readOnly = true)
    public GroupAnalyticsDto getAnalytics(UUID userId, UUID groupId, String monthParam,
                                          String year, String dateFrom, String dateTo) {
        requireMember(groupId, userId);
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));

        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        LocalDate start = range[0];
        LocalDate end = range[1];

        BigDecimal totalSpent = expenseRepository.sumGroupExpensesForMonth(groupId, start, end);

        // Category breakdown
        List<Object[]> catRows = expenseRepository.categoryBreakdownGroup(groupId, start, end);
        List<Map<String, Object>> categoryBreakdown = catRows.stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("categoryId", row[0] != null ? row[0].toString() : null);
                    m.put("categoryName", row[1] != null ? row[1].toString() : "Uncategorized");
                    m.put("total", row[2]);
                    return m;
                }).collect(Collectors.toList());

        // Daily trend — APPROVED only
        List<Expense> expenses = expenseRepository
                .findByGroupIdAndStatusAndExpenseDateBetweenOrderByExpenseDateDesc(
                        groupId, "APPROVED", start, end);
        Map<LocalDate, BigDecimal> dailyMap = new TreeMap<>();
        for (Expense e : expenses) {
            dailyMap.merge(e.getExpenseDate(), e.getAmount(), BigDecimal::add);
        }
        List<Map<String, Object>> dailyTrend = dailyMap.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("date", entry.getKey().toString());
                    m.put("amount", entry.getValue());
                    return m;
                }).collect(Collectors.toList());

        // Top spenders (by split share)
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
        List<Map<String, Object>> topSpenders = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal spent = splitRepository.sumMemberShareInGroupForMonth(
                    gm.getUser().getId(), groupId, start, end);
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("userId", gm.getUser().getId().toString());
            m.put("userName", gm.getUser().getFullName());
            m.put("spent", spent);
            if (totalSpent.compareTo(BigDecimal.ZERO) != 0) {
                double pct = spent.doubleValue() / totalSpent.doubleValue() * 100;
                m.put("pctOfTotal", Math.round(pct * 10.0) / 10.0);
            } else {
                m.put("pctOfTotal", 0.0);
            }
            topSpenders.add(m);
        }
        topSpenders.sort((a, b) -> ((BigDecimal) b.get("spent")).compareTo((BigDecimal) a.get("spent")));

        GroupAnalyticsDto dto = new GroupAnalyticsDto();
        dto.setGroupId(groupId);
        dto.setGroupName(group.getName());
        dto.setMonth(start);
        dto.setTotalSpent(totalSpent);
        dto.setCategoryBreakdown(categoryBreakdown);
        dto.setDailyTrend(dailyTrend);
        dto.setTopSpenders(topSpenders);
        return dto;
    }

    private void requireMember(UUID groupId, UUID userId) {
        if (!groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "ACTIVE")) {
            throw new AccessDeniedException("You are not a member of this group");
        }
    }

    /** Sums the (monthly) overall group budget across every month in the range. */
    private BigDecimal sumGroupBudgetOverRange(UUID groupId, LocalDate start, LocalDate end) {
        BigDecimal total = BigDecimal.ZERO;
        boolean found = false;
        YearMonth ym = YearMonth.from(start);
        YearMonth endYm = YearMonth.from(end);
        while (!ym.isAfter(endYm)) {
            Optional<GroupBudget> b = groupBudgetRepository.findByGroupIdAndMonth(groupId, ym.atDay(1));
            if (b.isPresent()) {
                total = total.add(b.get().getTotalBudget());
                found = true;
            }
            ym = ym.plusMonths(1);
        }
        return found ? total : null;
    }

    /** Sums a member's (monthly) budget cap across every month in the range. */
    private BigDecimal sumMemberBudgetOverRange(UUID groupId, UUID userId, LocalDate start, LocalDate end) {
        BigDecimal total = BigDecimal.ZERO;
        boolean found = false;
        YearMonth ym = YearMonth.from(start);
        YearMonth endYm = YearMonth.from(end);
        while (!ym.isAfter(endYm)) {
            Optional<GroupMemberBudget> b = memberBudgetRepository
                    .findByGroupIdAndUserIdAndMonth(groupId, userId, ym.atDay(1));
            if (b.isPresent()) {
                total = total.add(b.get().getBudgetLimit());
                found = true;
            }
            ym = ym.plusMonths(1);
        }
        return found ? total : null;
    }
}
