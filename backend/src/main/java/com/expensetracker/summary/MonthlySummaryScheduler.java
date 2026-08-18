package com.expensetracker.summary;

import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.mail.EmailService;
import com.expensetracker.mail.EmailService.MonthlySummaryEmailData;
import com.expensetracker.model.MonthlyNotificationLog;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.model.UserNotificationSettings;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.MonthlyNotificationLogRepository;
import com.expensetracker.repository.UserBudgetRepository;
import com.expensetracker.repository.UserNotificationSettingsRepository;
import com.expensetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

/**
 * Sends a monthly expense summary email to every user who enabled it. The first
 * day of each month at 02:00 by default (configurable via
 * {@code app.scheduler.monthly-summary-cron}). Idempotency is guaranteed by the
 * unique (user_id, month, notification_type) row in monthly_notification_logs:
 * a crashed or duplicated run can never email the same month twice.
 */
@Component
@EnableScheduling
public class MonthlySummaryScheduler {

    private static final Logger log = LoggerFactory.getLogger(MonthlySummaryScheduler.class);

    private static final String SUMMARY_TYPE = "MONTHLY_SUMMARY";
    private static final DateTimeFormatter MONTH_LABEL = DateTimeFormatter.ofPattern("MMMM yyyy");
    private static final int TOP_EXPENSES_LIMIT = 5;

    private final UserNotificationSettingsRepository settingsRepository;
    private final ExpenseRepository expenseRepository;
    private final UserBudgetRepository userBudgetRepository;
    private final MonthlyNotificationLogRepository logRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Value("${app.frontend.base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public MonthlySummaryScheduler(UserNotificationSettingsRepository settingsRepository,
                                   ExpenseRepository expenseRepository,
                                   UserBudgetRepository userBudgetRepository,
                                   MonthlyNotificationLogRepository logRepository,
                                   UserRepository userRepository,
                                   EmailService emailService) {
        this.settingsRepository = settingsRepository;
        this.expenseRepository = expenseRepository;
        this.userBudgetRepository = userBudgetRepository;
        this.logRepository = logRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    @Scheduled(cron = "${app.scheduler.monthly-summary-cron:0 0 2 1 * *}")
    public void runMonthlySummary() {
        LocalDate previousMonth = LocalDate.now().minusMonths(1);
        List<UserNotificationSettings> enabled = settingsRepository.findByMonthlySummaryEnabledTrue();
        log.info("Monthly summary: sending to {} enabled user(s) for {}", enabled.size(), previousMonth);
        for (UserNotificationSettings settings : enabled) {
            try {
                sendSummary(settings.getUser(), previousMonth);
            } catch (Exception e) {
                // Per-user isolation: a failure for one user never blocks the others.
                log.error("Monthly summary failed for user {}", settings.getUser().getId(), e);
            }
        }
    }

    @Transactional
    public void sendSummary(User user, LocalDate month) {
        LocalDate start = month.withDayOfMonth(1);
        LocalDate end = month.withDayOfMonth(month.lengthOfMonth());
        UUID userId = user.getId();

        if (logRepository.findByUserIdAndMonthAndNotificationType(userId, start, SUMMARY_TYPE).isPresent()) {
            log.debug("Monthly summary already sent for {} / {}", userId, start);
            return;
        }
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.debug("User {} has no email; skipping monthly summary", userId);
            return;
        }

        recordSent(user, start);

        BigDecimal total = expenseRepository.sumPersonalExpensesForMonth(userId, start, end);
        long transactionCount = expenseRepository.countPersonalExpensesForMonth(userId, start, end);

        BigDecimal overallBudget = null;
        BigDecimal remaining = null;
        Double utilization = null;
        boolean budgetExceeded = false;
        UserBudget overall = userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(userId, start)
                .orElse(null);
        if (overall != null && overall.getBudgetLimit().compareTo(BigDecimal.ZERO) > 0) {
            overallBudget = overall.getBudgetLimit();
            remaining = overallBudget.subtract(total).max(BigDecimal.ZERO);
            utilization = total.doubleValue() / overallBudget.doubleValue() * 100.0;
            budgetExceeded = total.compareTo(overallBudget) > 0;
        }

        String highestCategory = null;
        List<Map<String, Object>> categoryBreakdown = new ArrayList<>();
        BigDecimal best = BigDecimal.ZERO;
        for (Object[] row : expenseRepository.categoryBreakdownPersonal(userId, start, end)) {
            String name = row[1] != null ? row[1].toString() : "Uncategorized";
            BigDecimal amount = row[2] != null ? (BigDecimal) row[2] : BigDecimal.ZERO;
            Map<String, Object> entry = new LinkedHashMap<>();
            entry.put("name", name);
            entry.put("amount", amount);
            categoryBreakdown.add(entry);
            if (amount.compareTo(best) > 0) {
                best = amount;
                highestCategory = name;
            }
        }

        List<Map<String, Object>> topExpenses = expenseRepository
                .findTopPersonalExpensesForMonth(userId, start, end, org.springframework.data.domain.PageRequest.of(0, TOP_EXPENSES_LIMIT))
                .stream().map(e -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("description", e.getDescription());
                    m.put("amount", e.getAmount());
                    m.put("date", e.getExpenseDate());
                    return m;
                }).toList();

        MonthlySummaryEmailData data = new MonthlySummaryEmailData(
                start.format(MONTH_LABEL), total, overallBudget, remaining, utilization,
                highestCategory, categoryBreakdown, transactionCount, topExpenses,
                budgetExceeded, frontendBaseUrl);
        emailService.sendMonthlySummaryEmail(user.getEmail(), user.getFullName(), data);
    }

    void recordSent(User user, LocalDate month) {
        MonthlyNotificationLog entry = new MonthlyNotificationLog();
        entry.setUser(user);
        entry.setMonth(month);
        entry.setNotificationType(SUMMARY_TYPE);
        // saveAndFlush forces the unique constraint check inside this transaction.
        // On a duplicate (concurrent scheduler run) it throws, the caller's
        // transaction rolls back and the scheduler skips the already-sent month.
        logRepository.saveAndFlush(entry);
    }
}
