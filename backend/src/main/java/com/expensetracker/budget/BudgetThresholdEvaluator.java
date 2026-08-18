package com.expensetracker.budget;

import com.expensetracker.mail.MoneyFormatter;
import com.expensetracker.model.BudgetNotificationEvent;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.model.UserNotificationSettings;
import com.expensetracker.notification.EmailNotificationService;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.repository.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.UUID;

/**
 * Evaluates personal, category, total-expenditure, group and per-member budget
 * thresholds after each expense commit, then dispatches idempotent notifications.
 *
 * <p>Thresholds come from the user's {@link UserNotificationSettings} instead of
 * hard-coded 80/100. Idempotency is enforced by {@link BudgetNotificationEvent}
 * (unique dedup_key): the DB constraint is the concurrency-safe source of truth,
 * so a race between two writers can never produce a duplicate alert.
 *
 * <p>Emails are best-effort — {@link NotificationService#dispatchBudgetAlert}
 * swallows email failures so a broken SMTP server can never break evaluation or
 * roll back an expense that was already committed.
 */
@Component
public class BudgetThresholdEvaluator {

    private static final Logger log = LoggerFactory.getLogger(BudgetThresholdEvaluator.class);

    public static final String BUDGET_EXCEEDED = "BUDGET_EXCEEDED";
    public static final String BUDGET_THRESHOLD_REACHED = "BUDGET_THRESHOLD_REACHED";
    public static final String CATEGORY_BUDGET_EXCEEDED = "CATEGORY_BUDGET_EXCEEDED";
    public static final String CATEGORY_BUDGET_THRESHOLD_REACHED = "CATEGORY_BUDGET_THRESHOLD_REACHED";
    public static final String GROUP_BUDGET_EXCEEDED = "GROUP_BUDGET_EXCEEDED";
    public static final String GROUP_BUDGET_THRESHOLD_REACHED = "GROUP_BUDGET_THRESHOLD_REACHED";
    public static final String TOTAL_EXPENDITURE_EXCEEDED = "TOTAL_EXPENDITURE_EXCEEDED";
    public static final String TOTAL_EXPENDITURE_THRESHOLD_REACHED = "TOTAL_EXPENDITURE_THRESHOLD_REACHED";

    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMMM yyyy");

    private final UserBudgetRepository userBudgetRepository;
    private final GroupBudgetRepository groupBudgetRepository;
    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final UserNotificationSettingsRepository settingsRepository;
    private final BudgetNotificationEventRecorder eventRecorder;
    private final NotificationService notificationService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public BudgetThresholdEvaluator(
            UserBudgetRepository userBudgetRepository,
            GroupBudgetRepository groupBudgetRepository,
            GroupMemberBudgetRepository memberBudgetRepository,
            GroupMemberRepository groupMemberRepository,
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository,
            UserNotificationSettingsRepository settingsRepository,
            BudgetNotificationEventRecorder eventRecorder,
            NotificationService notificationService) {
        this.userBudgetRepository = userBudgetRepository;
        this.groupBudgetRepository = groupBudgetRepository;
        this.memberBudgetRepository = memberBudgetRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.settingsRepository = settingsRepository;
        this.eventRecorder = eventRecorder;
        this.notificationService = notificationService;
    }

    /**
     * Evaluates the personal overall budget, per-category budgets and the total
     * expenditure of the user for the month of the expense date.
     */
    public void evaluatePersonalBudget(User user, LocalDate expenseDate) {
        UserNotificationSettings settings = settingsRepository.findByUserId(user.getId()).orElse(null);
        if (settings == null) {
            return;
        }
        LocalDate start = expenseDate.withDayOfMonth(1);
        LocalDate end = expenseDate.withDayOfMonth(expenseDate.lengthOfMonth());

        if (settings.isOverallBudgetEnabled()) {
            userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(user.getId(), start)
                    .ifPresent(budget -> evaluateOverallBudget(user, settings, budget, start, end));
        }

        if (settings.isCategoryBudgetEnabled()) {
            List<UserBudget> categoryBudgets = userBudgetRepository.findByUserIdAndMonth(user.getId(), start);
            for (UserBudget budget : categoryBudgets) {
                if (budget.getCategory() != null) {
                    evaluateCategoryBudget(user, settings, budget, start, end);
                }
            }
        }

        if (settings.isTotalExpenditureEnabled()) {
            evaluateTotalExpenditure(user, settings, start, end);
        }
    }

    /** Evaluates the group budget and each member's cap for the month. */
    public void evaluateGroupBudget(ExpenseGroup group, LocalDate expenseDate) {
        LocalDate start = expenseDate.withDayOfMonth(1);
        LocalDate end = expenseDate.withDayOfMonth(expenseDate.lengthOfMonth());
        List<GroupMember> members = groupMemberRepository.findByGroupIdAndStatus(group.getId(), "ACTIVE");
        if (members.isEmpty()) return;

        groupBudgetRepository.findByGroupIdAndMonth(group.getId(), start).ifPresent(budget -> {
            BigDecimal spent = expenseRepository.sumGroupExpensesForMonth(group.getId(), start, end);
            double pct = percent(spent, budget.getTotalBudget());
            for (GroupMember gm : members) {
                User member = gm.getUser();
                UserNotificationSettings settings = settingsRepository.findByUserId(member.getId()).orElse(null);
                if (settings == null) continue;
                for (int threshold : settings.getOverallBudgetThresholds()) {
                    if (pct < threshold) continue;
                    boolean exceeded = threshold >= 100;
                    String type = exceeded ? GROUP_BUDGET_EXCEEDED : GROUP_BUDGET_THRESHOLD_REACHED;
                    String title = exceeded
                            ? "Group '" + group.getName() + "' budget exceeded!"
                            : "Group '" + group.getName() + "' budget at " + Math.round(pct) + "%";
                    String message = exceeded
                            ? "The group has exceeded its monthly budget of ₹" + budget.getTotalBudget()
                            : "The group has used " + Math.round(pct) + "% of its monthly budget.";
                    dispatchIfNotSent(member, settings, type, title, message, budget.getId(), null,
                            group.getId(), start, threshold, exceeded, group.getName(),
                            budget.getTotalBudget(), spent, pct, "GROUP_BUDGET");
                }
            }
        });

        for (GroupMember gm : members) {
            User member = gm.getUser();
            UserNotificationSettings settings = settingsRepository.findByUserId(member.getId()).orElse(null);
            if (settings == null) continue;
            memberBudgetRepository.findByGroupIdAndUserIdAndMonth(group.getId(), member.getId(), start)
                    .ifPresent(memberBudget -> {
                        BigDecimal memberSpent = splitRepository.sumMemberShareInGroupForMonth(
                                member.getId(), group.getId(), start, end);
                        double mPct = percent(memberSpent, memberBudget.getBudgetLimit());
                        for (int threshold : settings.getOverallBudgetThresholds()) {
                            if (mPct < threshold) continue;
                            boolean exceeded = threshold >= 100;
                            String type = exceeded ? BUDGET_EXCEEDED : BUDGET_THRESHOLD_REACHED;
                            String title = exceeded
                                    ? "Your cap in group '" + group.getName() + "' exceeded!"
                                    : "Your cap in group '" + group.getName() + "' at " + Math.round(mPct) + "%";
                            String message = "You've used " + Math.round(mPct) + "% of your budget cap in "
                                    + group.getName();
                            dispatchIfNotSent(member, settings, type, title, message,
                                    memberBudget.getId(), null, group.getId(), start, threshold,
                                    exceeded, "Your cap in " + group.getName(),
                                    memberBudget.getBudgetLimit(), memberSpent, mPct, "GROUP_MEMBER_BUDGET");
                        }
                    });
        }
    }

    private void evaluateOverallBudget(User user, UserNotificationSettings settings,
                                       UserBudget budget, LocalDate start, LocalDate end) {
        BigDecimal spent = expenseRepository.sumPersonalExpensesForMonth(user.getId(), start, end);
        double pct = percent(spent, budget.getBudgetLimit());
        for (int threshold : settings.getOverallBudgetThresholds()) {
            if (pct < threshold) continue;
            boolean exceeded = threshold >= 100;
            String type = exceeded ? BUDGET_EXCEEDED : BUDGET_THRESHOLD_REACHED;
            String title = exceeded
                    ? "Personal budget exceeded!"
                    : "Personal budget at " + Math.round(pct) + "%";
            String message = exceeded
                    ? "You've exceeded your monthly budget of ₹" + budget.getBudgetLimit()
                    : "You've used " + Math.round(pct) + "% of your monthly budget.";
            dispatchIfNotSent(user, settings, type, title, message, budget.getId(), null, null,
                    start, threshold, exceeded, "Monthly budget", budget.getBudgetLimit(), spent, pct, "USER_BUDGET");
        }
    }

    private void evaluateCategoryBudget(User user, UserNotificationSettings settings,
                                        UserBudget budget, LocalDate start, LocalDate end) {
        BigDecimal spent = expenseRepository.sumPersonalExpensesByCategoryForMonth(
                user.getId(), budget.getCategory().getId(), start, end);
        double pct = percent(spent, budget.getBudgetLimit());
        for (int threshold : settings.getCategoryBudgetThresholds()) {
            if (pct < threshold) continue;
            boolean exceeded = threshold >= 100;
            String type = exceeded ? CATEGORY_BUDGET_EXCEEDED : CATEGORY_BUDGET_THRESHOLD_REACHED;
            String title = exceeded
                    ? "Category budget exceeded: " + budget.getCategory().getName()
                    : "Category budget at " + Math.round(pct) + "%: " + budget.getCategory().getName();
            String message = exceeded
                    ? "You've exceeded your monthly budget of ₹" + budget.getBudgetLimit()
                    + " for " + budget.getCategory().getName() + "."
                    : "You've used " + Math.round(pct) + "% of your monthly budget for "
                    + budget.getCategory().getName() + ".";
            dispatchIfNotSent(user, settings, type, title, message, budget.getId(),
                    budget.getCategory().getId(), null, start, threshold, exceeded,
                    budget.getCategory().getName(), budget.getBudgetLimit(), spent, pct, "CATEGORY_BUDGET");
        }
    }

    private void evaluateTotalExpenditure(User user, UserNotificationSettings settings,
                                          LocalDate start, LocalDate end) {
        BigDecimal personal = expenseRepository.sumPersonalExpensesForMonth(user.getId(), start, end);
        BigDecimal groupShares = BigDecimal.ZERO;
        for (GroupMember gm : groupMemberRepository.findByUserIdAndStatus(user.getId(), "ACTIVE")) {
            groupShares = groupShares.add(splitRepository.sumMemberShareInGroupForMonth(
                    user.getId(), gm.getGroup().getId(), start, end));
        }
        BigDecimal total = personal.add(groupShares);
        // Total-expenditure thresholds are absolute monthly amounts (whole rupees).
        for (int threshold : settings.getTotalExpenditureThresholds()) {
            if (total.doubleValue() < threshold) continue;
            boolean exceeded = total.doubleValue() >= threshold;
            String type = TOTAL_EXPENDITURE_THRESHOLD_REACHED;
            String title = "Total expenditure above " + threshold;
            String message = "Your total expenditure this month is " + MoneyFormatter.format(total)
                    + " (threshold " + MoneyFormatter.format(BigDecimal.valueOf(threshold)) + ").";
            EmailNotificationService.BudgetAlertEmail email = new EmailNotificationService.BudgetAlertEmail(
                    "Total expenditure", total, BigDecimal.valueOf(threshold), 0,
                    BigDecimal.ZERO, exceeded, start.format(MONTH_LABEL), dashboardUrl());
            dispatchIfNotSent(user, settings, type, title, message, null, null, null,
                    start, threshold, exceeded, email, "TOTAL_EXPENDITURE");
        }
    }

    private void dispatchIfNotSent(User user, UserNotificationSettings settings,
                                   String type, String title, String message,
                                   UUID budgetId, UUID categoryId, UUID groupId,
                                   LocalDate month, int threshold, boolean exceeded,
                                   String budgetName, BigDecimal limit, BigDecimal spent,
                                   double pct, String referenceType) {
        EmailNotificationService.BudgetAlertEmail email =
                new EmailNotificationService.BudgetAlertEmail(
                        budgetName, spent, limit, pct,
                        limit.subtract(spent), exceeded, month.format(MONTH_LABEL), dashboardUrl());
        dispatchIfNotSent(user, settings, type, title, message, budgetId, categoryId, groupId,
                month, threshold, exceeded, email, referenceType);
    }

    private void dispatchIfNotSent(User user, UserNotificationSettings settings,
                                   String type, String title, String message,
                                   UUID budgetId, UUID categoryId, UUID groupId,
                                   LocalDate month, int threshold, boolean exceeded,
                                   EmailNotificationService.BudgetAlertEmail emailData,
                                   String referenceType) {
        String dedupKey = BudgetNotificationEvent.buildDedupKey(
                user.getId(), budgetId, categoryId, groupId, month, threshold, type);
        if (eventRecorder.exists(dedupKey)) {
            return;
        }
        try {
            eventRecorder.record(user, dedupKey, budgetId, categoryId, groupId, month, threshold, type);
        } catch (DataIntegrityViolationException e) {
            // Lost a race against a concurrent writer — the unique constraint is the
            // source of truth, so someone already recorded this exact alert.
            log.debug("Budget alert already recorded for dedupKey {}", dedupKey);
            return;
        }
        notificationService.dispatchBudgetAlert(
                user, settings.isInAppEnabled(), settings.isEmailEnabled(),
                type, title, message,
                budgetId != null ? budgetId : groupId, referenceType, emailData);
    }

    private static double percent(BigDecimal spent, BigDecimal limit) {
        if (limit == null || limit.compareTo(BigDecimal.ZERO) == 0) return 0.0;
        return spent.doubleValue() / limit.doubleValue() * 100.0;
    }

    private String dashboardUrl() {
        return frontendBaseUrl + "/expenses";
    }
}
