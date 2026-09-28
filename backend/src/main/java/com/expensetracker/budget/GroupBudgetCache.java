package com.expensetracker.budget;

import com.expensetracker.budget.dto.GroupBudgetStatusResponse;
import com.expensetracker.budget.dto.MemberBudgetDto;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.GroupMemberBudget;
import com.expensetracker.model.GroupBudget;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.ExpenseSplitRepository;
import com.expensetracker.repository.GroupBudgetRepository;
import com.expensetracker.repository.GroupMemberBudgetRepository;
import com.expensetracker.repository.GroupMemberRepository;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Cache holder for the group budget aggregates.
 *
 * <p>Same split as {@code GroupReportCache}: {@link GroupBudgetService} performs
 * the member/admin check and resolves the date range on every call, then delegates
 * here, so a cache hit can never bypass an authorization check. Keys are
 * {@code (groupId, range)} because the figures are identical for every member.
 *
 * <p>Write paths ({@code setGroupBudget}, {@code setMemberBudget}) call the
 * explicitly uncached {@link #freshBudgetStatus} / {@link #memberBudgetView}
 * methods instead, so a response returned immediately after a mutation always
 * reflects that mutation rather than a previously cached value.
 *
 * <p>Returned DTOs and lists are shared mutable references held by the cache and
 * must be treated as read-only by callers.
 */
@Component
public class GroupBudgetCache {

    private final GroupBudgetRepository groupBudgetRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseGroupRepository groupRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;

    public GroupBudgetCache(
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseGroupRepository groupRepository,
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository) {
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupRepository = groupRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
    }

    @Cacheable(cacheNames = "groupBudgetStatus", key = "#groupId + ':' + #start + ':' + #end")
    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse budgetStatus(UUID groupId, LocalDate start, LocalDate end) {
        return buildGroupBudgetStatus(requireGroup(groupId), start, end);
    }

    @Cacheable(cacheNames = "groupMemberBudgets", key = "#groupId + ':' + #start + ':' + #end")
    @Transactional(readOnly = true)
    public List<MemberBudgetDto> memberBudgets(UUID groupId, LocalDate start, LocalDate end) {
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
        List<MemberBudgetDto> result = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal spent = splitRepository.sumMemberShareInGroupForMonth(
                    gm.getUser().getId(), groupId, start, end);
            BigDecimal cap = sumMemberBudgetOverRange(groupId, gm.getUser().getId(), start, end);
            MemberBudgetDto dto = new MemberBudgetDto();
            dto.setUserId(gm.getUser().getId());
            dto.setUserName(gm.getUser().getFullName());
            dto.setMonth(start);
            dto.setSpent(spent);
            if (cap != null) {
                dto.setBudgetLimit(cap);
                dto.setRemaining(cap.subtract(spent));
                double mPct = cap.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                        : spent.doubleValue() / cap.doubleValue() * 100.0;
                dto.setPercentUsed(Math.round(mPct * 10.0) / 10.0);
                dto.setStatus(mPct >= 100 ? "EXCEEDED" : mPct >= 80 ? "WARNING" : "OK");
            }
            result.add(dto);
        }
        return result;
    }

    /** Uncached counterpart of {@link #budgetStatus}, for post-write responses. */
    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse freshBudgetStatus(UUID groupId, LocalDate start, LocalDate end) {
        return buildGroupBudgetStatus(requireGroup(groupId), start, end);
    }

    /** Uncached single-member view, returned by the member budget write path. */
    @Transactional(readOnly = true)
    public MemberBudgetDto memberBudgetView(GroupMemberBudget cap, UUID groupId, LocalDate month) {
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());

        BigDecimal spent = splitRepository.sumMemberShareInGroupForMonth(
                cap.getUser().getId(), groupId, start, end);
        double pct = cap.getBudgetLimit().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : spent.doubleValue() / cap.getBudgetLimit().doubleValue() * 100.0;

        MemberBudgetDto dto = new MemberBudgetDto();
        dto.setUserId(cap.getUser().getId());
        dto.setUserName(cap.getUser().getFullName());
        dto.setMonth(month);
        dto.setBudgetLimit(cap.getBudgetLimit());
        dto.setSpent(spent);
        dto.setRemaining(cap.getBudgetLimit().subtract(spent));
        dto.setPercentUsed(Math.round(pct * 10.0) / 10.0);
        dto.setStatus(pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "OK");
        return dto;
    }

    // --- private helpers ---

    private ExpenseGroup requireGroup(UUID groupId) {
        return groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
    }

    /** Builds a status response for an arbitrary (possibly multi-month) range. */
    private GroupBudgetStatusResponse buildGroupBudgetStatus(ExpenseGroup group, LocalDate start, LocalDate end) {
        BigDecimal totalBudget = sumGroupBudgetOverRange(group.getId(), start, end);
        BigDecimal spent = expenseRepository.sumGroupExpensesForMonth(group.getId(), start, end);

        // Build per-member breakdown
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(group.getId(), "ACTIVE");
        List<MemberBudgetDto> memberBreakdown = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal memberSpent = splitRepository.sumMemberShareInGroupForMonth(
                    gm.getUser().getId(), group.getId(), start, end);
            MemberBudgetDto mdto = new MemberBudgetDto();
            mdto.setUserId(gm.getUser().getId());
            mdto.setUserName(gm.getUser().getFullName());
            mdto.setMonth(start);
            mdto.setSpent(memberSpent);

            BigDecimal cap = sumMemberBudgetOverRange(group.getId(), gm.getUser().getId(), start, end);
            if (cap != null) {
                mdto.setBudgetLimit(cap);
                mdto.setRemaining(cap.subtract(memberSpent));
                double mPct = cap.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                        : memberSpent.doubleValue() / cap.doubleValue() * 100.0;
                mdto.setPercentUsed(Math.round(mPct * 10.0) / 10.0);
                mdto.setStatus(mPct >= 100 ? "EXCEEDED" : mPct >= 80 ? "WARNING" : "OK");
            }
            memberBreakdown.add(mdto);
        }

        GroupBudgetStatusResponse resp = new GroupBudgetStatusResponse();
        resp.setGroupId(group.getId());
        resp.setGroupName(group.getName());
        resp.setMonth(start);
        if (totalBudget != null) {
            BigDecimal remaining = totalBudget.subtract(spent);
            double pct = totalBudget.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                    : spent.doubleValue() / totalBudget.doubleValue() * 100.0;
            resp.setTotalBudget(totalBudget);
            resp.setRemaining(remaining);
            resp.setPercentUsed(Math.round(pct * 10.0) / 10.0);
            resp.setStatus(pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "OK");
        } else {
            resp.setStatus("NO_BUDGET");
        }
        resp.setTotalSpent(spent);
        resp.setMemberBreakdown(memberBreakdown);
        return resp;
    }

    /** Sums the overall group budget across every month in the range (null if none set). */
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

    /** Sums a member's monthly budget cap across every month in the range (null if none set). */
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
