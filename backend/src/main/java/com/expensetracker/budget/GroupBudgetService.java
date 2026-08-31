package com.expensetracker.budget;

import com.expensetracker.budget.dto.*;
import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.*;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.notification.NotificationSettingsService;
import com.expensetracker.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class GroupBudgetService {

    private final GroupBudgetRepository groupBudgetRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final NotificationService notificationService;
    private final NotificationSettingsService notificationSettingsService;

    public GroupBudgetService(
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseGroupRepository groupRepository,
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository,
            NotificationService notificationService,
            NotificationSettingsService notificationSettingsService) {
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.notificationService = notificationService;
        this.notificationSettingsService = notificationSettingsService;
    }

    @Transactional
    public GroupBudgetStatusResponse setGroupBudget(User admin, UUID groupId, BigDecimal totalBudget, String monthParam) {
        requireAdmin(groupId, admin.getId());

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        LocalDate month = BudgetService.parseMonth(monthParam);

        GroupBudget budget = groupBudgetRepository.findByGroupIdAndMonth(groupId, month)
                .orElse(new GroupBudget());
        budget.setGroup(group);
        budget.setMonth(month);
        budget.setTotalBudget(totalBudget);
        budget.setSetBy(admin);
        GroupBudget saved = groupBudgetRepository.save(budget);

        // Notify all members based on their notification settings
        groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE").forEach(gm -> {
            var settings = notificationSettingsService.getSettings(gm.getUser().getId());
            boolean inAppEnabled = settings.getInAppNotifications() && settings.getBudgetUpdateEnabled();
            boolean emailEnabled = settings.getEmailNotifications() && settings.getBudgetUpdateEnabled();
            if (inAppEnabled || emailEnabled) {
                String title = "Group budget updated";
                String message = "The budget for '" + group.getName() + "' has been set to ₹" + totalBudget;
                notificationService.dispatchNotification(
                        gm.getUser(), inAppEnabled, emailEnabled,
                        "BUDGET_UPDATED", title, message,
                        group.getId(), "GROUP");
            }
        });

        return buildGroupBudgetStatus(group, month, month);
    }

    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse getGroupBudgetStatus(User user, UUID groupId, String monthParam,
                                                          String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return buildGroupBudgetStatus(group, range[0], range[1]);
    }

    @Transactional
    public MemberBudgetDto setMemberBudget(User admin, UUID groupId, UUID targetUserId,
                                            BigDecimal budgetLimit, String monthParam) {
        requireAdmin(groupId, admin.getId());

        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        User targetUser = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + targetUserId));

        // Target must be an active member
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, targetUserId, "ACTIVE");
        if (!isMember) throw new AccessDeniedException("Target user is not an active member of this group");

        LocalDate month = BudgetService.parseMonth(monthParam);

        GroupMemberBudget memberBudget = memberBudgetRepository
                .findByGroupIdAndUserIdAndMonth(groupId, targetUserId, month)
                .orElse(new GroupMemberBudget());
        memberBudget.setGroup(group);
        memberBudget.setUser(targetUser);
        memberBudget.setMonth(month);
        memberBudget.setBudgetLimit(budgetLimit);
        memberBudget.setSetBy(admin);
        GroupMemberBudget saved = memberBudgetRepository.save(memberBudget);

        return buildMemberBudgetDto(saved, groupId, month);
    }

    @Transactional(readOnly = true)
    public List<MemberBudgetDto> getMemberBudgets(User user, UUID groupId, String monthParam,
                                                  String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        LocalDate start = range[0];
        LocalDate end = range[1];

        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE");
        List<MemberBudgetDto> result = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal spent = splitRepository.sumMemberShareInGroupForMonth(gm.getUser().getId(), groupId, start, end);
            BigDecimal cap = sumMemberBudgetOverRange(groupId, gm.getUser().getId(), start, end);
            MemberBudgetDto dto = new MemberBudgetDto();
            dto.setUserId(gm.getUser().getId());
            dto.setUserName(gm.getUser().getFullName());
            dto.setMonth(start);
            if (cap != null) {
                dto.setBudgetLimit(cap);
                dto.setSpent(spent);
                dto.setRemaining(cap.subtract(spent));
                double mPct = cap.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                        : spent.doubleValue() / cap.doubleValue() * 100.0;
                dto.setPercentUsed(Math.round(mPct * 10.0) / 10.0);
                dto.setStatus(mPct >= 100 ? "EXCEEDED" : mPct >= 80 ? "WARNING" : "OK");
            } else {
                dto.setSpent(spent);
            }
            result.add(dto);
        }
        return result;
    }

    // --- private helpers ---

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

    private MemberBudgetDto buildMemberBudgetDto(GroupMemberBudget cap, UUID groupId, LocalDate month) {
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

    private void requireAdmin(UUID groupId, UUID userId) {
        boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(gm -> "ADMIN".equals(gm.getRole()) && "ACTIVE".equals(gm.getStatus()))
                .orElse(false);
        if (!isAdmin) throw new AccessDeniedException("Only group admins can perform this action");
    }

    private void requireMember(UUID groupId, UUID userId) {
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "ACTIVE");
        if (!isMember) throw new AccessDeniedException("You are not a member of this group");
    }
}
