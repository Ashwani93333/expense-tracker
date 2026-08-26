package com.expensetracker.notification;

import com.expensetracker.mail.EmailService;
import com.expensetracker.mail.EmailService.BudgetAlertEmailData;
import com.expensetracker.mail.EmailService.CategoryBudgetAlertEmailData;
import com.expensetracker.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

/**
 * Translates budget alert types into the corresponding {@link EmailService}
 * messages. Email failures are logged and swallowed — they never propagate so a
 * broken SMTP server can never fail expense creation or idempotency bookkeeping.
 */
@Service
public class EmailNotificationService {

    private static final Logger log = LoggerFactory.getLogger(EmailNotificationService.class);

    private final EmailService emailService;

    public EmailNotificationService(EmailService emailService) {
        this.emailService = emailService;
    }

    /** Sends a personal or group budget threshold/exceeded email. */
    public void sendBudgetAlertEmail(User user, String type, BudgetAlertEmail data) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.debug("User {} has no email; skipping budget alert email", user.getId());
            return;
        }
        try {
            boolean exceeded = isExceeded(type);
            String title = alertTitle(type, data.budgetName);
            String message = exceeded
                    ? "You have exceeded your budget. Consider reviewing your recent expenses."
                    : "You have reached one of your configured budget thresholds. Keep an eye on your spending.";
            BudgetAlertEmailData emailData = new BudgetAlertEmailData(
                    title, message, data.budgetName, data.spent, data.limit,
                    data.percentUsed, data.remaining, exceeded, data.monthLabel, data.ctaUrl);
            emailService.sendBudgetAlertEmail(user.getEmail(), user.getFullName(), emailData);
        } catch (RuntimeException e) {
            log.warn("Budget alert email failed for user {}; continuing", user.getId(), e);
        }
    }

    /** Sends a per-category budget threshold/exceeded email. */
    public void sendCategoryBudgetAlertEmail(User user, String type, CategoryBudgetAlertEmail data) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.debug("User {} has no email; skipping category budget alert email", user.getId());
            return;
        }
        boolean exceeded = isExceeded(type);
        CategoryBudgetAlertEmailData emailData = new CategoryBudgetAlertEmailData(
                data.categoryName, data.spent, data.limit, data.percentUsed,
                data.remaining, exceeded, data.monthLabel);
        emailService.sendCategoryBudgetAlertEmail(user.getEmail(), user.getFullName(), emailData);
    }

    private static boolean isExceeded(String type) {
        return "BUDGET_EXCEEDED".equals(type)
                || "GROUP_BUDGET_EXCEEDED".equals(type)
                || "CATEGORY_BUDGET_EXCEEDED".equals(type)
                || "TOTAL_EXPENDITURE_EXCEEDED".equals(type);
    }

    private static String alertTitle(String type, String budgetName) {
        return switch (type) {
            case "BUDGET_EXCEEDED", "GROUP_BUDGET_EXCEEDED" -> "Budget exceeded";
            case "BUDGET_THRESHOLD_REACHED", "GROUP_BUDGET_THRESHOLD_REACHED" -> "Budget threshold reached";
            default -> "Budget alert";
        } + (budgetName == null ? "" : " — " + budgetName);
    }

    /** Sends a generic notification email for budget updates, expiry date updates, and payment approve/reject. */
    public void sendGenericNotificationEmail(User user, String type, String title, String message) {
        if (user.getEmail() == null || user.getEmail().isBlank()) {
            log.debug("User {} has no email; skipping generic notification email", user.getId());
            return;
        }
        try {
            emailService.sendGenericNotificationEmail(user.getEmail(), user.getFullName(), title, message);
        } catch (RuntimeException e) {
            log.warn("Generic notification email failed for user {}; continuing", user.getId(), e);
        }
    }

    /** Data payload for a budget alert email (personal, group, or category). */
    public static class BudgetAlertEmail {
        public String budgetName;
        public BigDecimal spent;
        public BigDecimal limit;
        public double percentUsed;
        public BigDecimal remaining;
        public boolean exceeded;
        public String monthLabel;
        public String ctaUrl;

        public BudgetAlertEmail() {}

        public BudgetAlertEmail(String budgetName, BigDecimal spent, BigDecimal limit, double percentUsed,
                                BigDecimal remaining, boolean exceeded, String monthLabel, String ctaUrl) {
            this.budgetName = budgetName;
            this.spent = spent;
            this.limit = limit;
            this.percentUsed = percentUsed;
            this.remaining = remaining;
            this.exceeded = exceeded;
            this.monthLabel = monthLabel;
            this.ctaUrl = ctaUrl;
        }
    }

    /** Data payload for a per-category budget alert email. */
    public static class CategoryBudgetAlertEmail {
        public String categoryName;
        public BigDecimal spent;
        public BigDecimal limit;
        public double percentUsed;
        public BigDecimal remaining;
        public boolean exceeded;
        public String monthLabel;

        public CategoryBudgetAlertEmail() {}

        public CategoryBudgetAlertEmail(String categoryName, BigDecimal spent, BigDecimal limit, double percentUsed,
                                        BigDecimal remaining, boolean exceeded, String monthLabel) {
            this.categoryName = categoryName;
            this.spent = spent;
            this.limit = limit;
            this.percentUsed = percentUsed;
            this.remaining = remaining;
            this.exceeded = exceeded;
            this.monthLabel = monthLabel;
        }
    }
}
