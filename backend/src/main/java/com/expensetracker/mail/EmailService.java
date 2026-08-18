package com.expensetracker.mail;

import org.springframework.mail.SimpleMailMessage;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

/**
 * Contract for sending application emails via SMTP. Controllers and business
 * services never touch {@code JavaMailSender} directly — they go through this.
 */
public interface EmailService {

    void sendSimpleEmail(String to, String subject, String text);

    void sendHtmlEmail(String to, String subject, String html);

    /**
     * Budget threshold / exceeded alert (personal or group).
     *
     * @return true when the mail sender accepted the message
     */
    boolean sendBudgetAlertEmail(String to, String recipientName, BudgetAlertEmailData data);

    /** Per-category budget alert. @return true when accepted by the mail sender */
    boolean sendCategoryBudgetAlertEmail(String to, String recipientName, CategoryBudgetAlertEmailData data);

    /** Monthly expense summary. @return true when accepted by the mail sender */
    boolean sendMonthlySummaryEmail(String to, String recipientName, MonthlySummaryEmailData data);

    /**
     * Group invitation.
     *
     * @return true when the mail sender accepted the message
     */
    boolean sendGroupInviteEmail(String to, GroupInviteEmailData data);

    /** Reusable value object for budget alert emails. */
    class BudgetAlertEmailData {
        public String title;
        public String message;
        public String budgetName;        // e.g. "Monthly budget", "Goa Trip 2026 budget"
        public BigDecimal spent;
        public BigDecimal limit;
        public double percentUsed;
        public BigDecimal remaining;
        public boolean exceeded;
        public String monthLabel;
        public String ctaUrl;

        public BudgetAlertEmailData(String title, String message, String budgetName, BigDecimal spent,
                                    BigDecimal limit, double percentUsed, BigDecimal remaining,
                                    boolean exceeded, String monthLabel, String ctaUrl) {
            this.title = title;
            this.message = message;
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

    class CategoryBudgetAlertEmailData {
        public String categoryName;
        public BigDecimal spent;
        public BigDecimal limit;
        public double percentUsed;
        public BigDecimal remaining;
        public boolean exceeded;
        public String monthLabel;

        public CategoryBudgetAlertEmailData(String categoryName, BigDecimal spent, BigDecimal limit,
                                            double percentUsed, BigDecimal remaining, boolean exceeded, String monthLabel) {
            this.categoryName = categoryName;
            this.spent = spent;
            this.limit = limit;
            this.percentUsed = percentUsed;
            this.remaining = remaining;
            this.exceeded = exceeded;
            this.monthLabel = monthLabel;
        }
    }

    class MonthlySummaryEmailData {
        public String monthLabel;
        public BigDecimal totalExpenditure;
        public BigDecimal overallBudget;          // nullable
        public BigDecimal remainingBudget;        // nullable
        public Double budgetUtilization;          // nullable
        public String highestSpendingCategory;
        public List<Map<String, Object>> categoryBreakdown; // [{name, amount}]
        public long transactionCount;
        public List<Map<String, Object>> topExpenses;       // [{description, amount, date}]
        public boolean budgetExceeded;
        public String dashboardUrl;

        public MonthlySummaryEmailData(String monthLabel, BigDecimal totalExpenditure, BigDecimal overallBudget,
                                       BigDecimal remainingBudget, Double budgetUtilization, String highestSpendingCategory,
                                       List<Map<String, Object>> categoryBreakdown, long transactionCount,
                                       List<Map<String, Object>> topExpenses, boolean budgetExceeded, String dashboardUrl) {
            this.monthLabel = monthLabel;
            this.totalExpenditure = totalExpenditure;
            this.overallBudget = overallBudget;
            this.remainingBudget = remainingBudget;
            this.budgetUtilization = budgetUtilization;
            this.highestSpendingCategory = highestSpendingCategory;
            this.categoryBreakdown = categoryBreakdown;
            this.transactionCount = transactionCount;
            this.topExpenses = topExpenses;
            this.budgetExceeded = budgetExceeded;
            this.dashboardUrl = dashboardUrl;
        }
    }

    class GroupInviteEmailData {
        public String inviterName;
        public String groupName;
        public String groupDescription;
        public OffsetDateTime expiresAt;
        public String inviteUrl;

        public GroupInviteEmailData(String inviterName, String groupName, String groupDescription,
                                    OffsetDateTime expiresAt, String inviteUrl) {
            this.inviterName = inviterName;
            this.groupName = groupName;
            this.groupDescription = groupDescription;
            this.expiresAt = expiresAt;
            this.inviteUrl = inviteUrl;
        }
    }
}
