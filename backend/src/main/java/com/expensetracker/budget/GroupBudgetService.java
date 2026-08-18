package com.expensetracker.budget;

import com.expensetracker.budget.dto.*;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.*;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
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

    public GroupBudgetService(
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseGroupRepository groupRepository,
            UserRepository userRepository,
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository,
            NotificationService notificationService) {
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.notificationService = notificationService;
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

        // Notify all members
        groupMemberRepository.findByGroupIdAndStatus(groupId, "ACTIVE").forEach(gm ->
                notificationService.createNotification(
                        gm.getUser(), "GROUP_BUDGET_SET",
                        "Group budget updated",
                        "The budget for '" + group.getName() + "' has been set to ₹" + totalBudget,
                        group.getId(), "GROUP"));

        return buildGroupBudgetStatus(group, saved, month);
    }

    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse getGroupBudgetStatus(User user, UUID groupId, String monthParam) {
        requireMember(groupId, user.getId());
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        LocalDate month = BudgetService.parseMonth(monthParam);

        GroupBudget budget = groupBudgetRepository.findByGroupIdAndMonth(groupId, month)
                .orElseThrow(() -> new ResourceNotFoundException("No budget set for this group/month"));

        return buildGroupBudgetStatus(group, budget, month);
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
    public List<MemberBudgetDto> getMemberBudgets(User user, UUID groupId, String monthParam) {
        requireMember(groupId, user.getId());
        LocalDate month = BudgetService.parseMonth(monthParam);
        List<GroupMemberBudget> caps = memberBudgetRepository.findByGroupIdAndMonth(groupId, month);

        List<MemberBudgetDto> result = new ArrayList<>();
        for (GroupMemberBudget cap : caps) {
            result.add(buildMemberBudgetDto(cap, groupId, month));
        }
        return result;
    }

    // --- private helpers ---

    private GroupBudgetStatusResponse buildGroupBudgetStatus(ExpenseGroup group, GroupBudget budget, LocalDate month) {
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());

        BigDecimal spent = expenseRepository.sumGroupExpensesForMonth(group.getId(), start, end);
        BigDecimal totalBudget = budget.getTotalBudget();
        BigDecimal remaining = totalBudget.subtract(spent);
        double pct = totalBudget.compareTo(BigDecimal.ZERO) == 0 ? 0.0
                : spent.doubleValue() / totalBudget.doubleValue() * 100.0;

        // Build per-member breakdown
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(group.getId(), "ACTIVE");
        List<MemberBudgetDto> memberBreakdown = new ArrayList<>();
        for (GroupMember gm : members) {
            BigDecimal memberSpent = splitRepository.sumMemberShareInGroupForMonth(
                    gm.getUser().getId(), group.getId(), start, end);
            MemberBudgetDto mdto = new MemberBudgetDto();
            mdto.setUserId(gm.getUser().getId());
            mdto.setUserName(gm.getUser().getFullName());
            mdto.setMonth(month);
            mdto.setSpent(memberSpent);

            memberBudgetRepository.findByGroupIdAndUserIdAndMonth(group.getId(), gm.getUser().getId(), month)
                    .ifPresent(cap -> {
                        mdto.setBudgetLimit(cap.getBudgetLimit());
                        mdto.setRemaining(cap.getBudgetLimit().subtract(memberSpent));
                        double mPct = cap.getBudgetLimit().compareTo(BigDecimal.ZERO) == 0 ? 0.0
                                : memberSpent.doubleValue() / cap.getBudgetLimit().doubleValue() * 100.0;
                        mdto.setPercentUsed(Math.round(mPct * 10.0) / 10.0);
                        mdto.setStatus(mPct >= 100 ? "EXCEEDED" : mPct >= 80 ? "WARNING" : "OK");
                    });
            memberBreakdown.add(mdto);
        }

        GroupBudgetStatusResponse resp = new GroupBudgetStatusResponse();
        resp.setGroupId(group.getId());
        resp.setGroupName(group.getName());
        resp.setMonth(month);
        resp.setTotalBudget(totalBudget);
        resp.setTotalSpent(spent);
        resp.setRemaining(remaining);
        resp.setPercentUsed(Math.round(pct * 10.0) / 10.0);
        resp.setStatus(pct >= 100 ? "EXCEEDED" : pct >= 80 ? "WARNING" : "OK");
        resp.setMemberBreakdown(memberBreakdown);
        return resp;
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
