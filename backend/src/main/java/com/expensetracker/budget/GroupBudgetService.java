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
import java.util.List;
import java.util.UUID;

@Service
public class GroupBudgetService {

    private final GroupBudgetRepository groupBudgetRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseGroupRepository groupRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final NotificationSettingsService notificationSettingsService;
    private final GroupBudgetCache budgetCache;

    public GroupBudgetService(
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseGroupRepository groupRepository,
            UserRepository userRepository,
            NotificationService notificationService,
            NotificationSettingsService notificationSettingsService,
            GroupBudgetCache budgetCache) {
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.groupRepository = groupRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
        this.notificationSettingsService = notificationSettingsService;
        this.budgetCache = budgetCache;
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
        groupBudgetRepository.save(budget);

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

        // Uncached on purpose: this response must reflect the budget just written.
        return budgetCache.freshBudgetStatus(groupId, month, month);
    }

    /**
     * Membership is re-checked on every call, before the cache is consulted, so a
     * cache hit can never serve budget figures to a user who has since left the
     * group.
     */
    @Transactional(readOnly = true)
    public GroupBudgetStatusResponse getGroupBudgetStatus(User user, UUID groupId, String monthParam,
                                                          String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return budgetCache.budgetStatus(groupId, range[0], range[1]);
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

        return budgetCache.memberBudgetView(saved, groupId, month);
    }

    @Transactional(readOnly = true)
    public List<MemberBudgetDto> getMemberBudgets(User user, UUID groupId, String monthParam,
                                                  String year, String dateFrom, String dateTo) {
        requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        return budgetCache.memberBudgets(groupId, range[0], range[1]);
    }

    // --- private helpers ---

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
