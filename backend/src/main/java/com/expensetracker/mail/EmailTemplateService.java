package com.expensetracker.mail;

import com.expensetracker.mail.EmailService.BudgetAlertEmailData;
import com.expensetracker.mail.EmailService.CategoryBudgetAlertEmailData;
import com.expensetracker.mail.EmailService.GroupInviteEmailData;
import com.expensetracker.mail.EmailService.MonthlySummaryEmailData;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Renders the HTML bodies for all application emails from Thymeleaf templates in
 * {@code templates/mail}. All amounts are formatted with {@link MoneyFormatter}.
 */
@Service
public class EmailTemplateService {

    private final TemplateEngine templateEngine;

    public EmailTemplateService(TemplateEngine templateEngine) {
        this.templateEngine = templateEngine;
    }

    public String renderBudgetAlert(BudgetAlertEmailData data) {
        Context context = commonContext();
        context.setVariable("title", data.title);
        context.setVariable("message", data.message);
        context.setVariable("budgetName", data.budgetName);
        context.setVariable("spent", MoneyFormatter.format(data.spent));
        context.setVariable("limit", MoneyFormatter.format(data.limit));
        context.setVariable("percentUsed", formatPercent(data.percentUsed));
        context.setVariable("remaining", MoneyFormatter.format(data.remaining));
        context.setVariable("exceeded", data.exceeded);
        context.setVariable("monthLabel", data.monthLabel);
        context.setVariable("ctaUrl", data.ctaUrl);
        return templateEngine.process("mail/budget-alert", context);
    }

    public String renderCategoryBudgetAlert(CategoryBudgetAlertEmailData data) {
        Context context = commonContext();
        context.setVariable("categoryName", data.categoryName);
        context.setVariable("spent", MoneyFormatter.format(data.spent));
        context.setVariable("limit", MoneyFormatter.format(data.limit));
        context.setVariable("percentUsed", formatPercent(data.percentUsed));
        context.setVariable("remaining", MoneyFormatter.format(data.remaining));
        context.setVariable("exceeded", data.exceeded);
        context.setVariable("monthLabel", data.monthLabel);
        context.setVariable("ctaUrl", "/expenses");
        return templateEngine.process("mail/category-budget-alert", context);
    }

    public String renderMonthlySummary(MonthlySummaryEmailData data) {
        Context context = commonContext();
        context.setVariable("monthLabel", data.monthLabel);
        context.setVariable("totalExpenditure", MoneyFormatter.format(data.totalExpenditure));
        context.setVariable("overallBudget", data.overallBudget == null ? null : MoneyFormatter.format(data.overallBudget));
        context.setVariable("remainingBudget", data.remainingBudget == null ? null : MoneyFormatter.format(data.remainingBudget));
        context.setVariable("budgetUtilization", data.budgetUtilization == null ? null : formatPercent(data.budgetUtilization));
        context.setVariable("highestSpendingCategory", data.highestSpendingCategory);
        context.setVariable("categoryBreakdown", toAmountMaps(data.categoryBreakdown));
        context.setVariable("transactionCount", data.transactionCount);
        context.setVariable("topExpenses", data.topExpenses);
        context.setVariable("budgetExceeded", data.budgetExceeded);
        context.setVariable("dashboardUrl", data.dashboardUrl);
        return templateEngine.process("mail/monthly-summary", context);
    }

    public String renderGroupInvite(GroupInviteEmailData data) {
        Context context = commonContext();
        context.setVariable("inviterName", data.inviterName);
        context.setVariable("groupName", data.groupName);
        context.setVariable("groupDescription", data.groupDescription);
        context.setVariable("expiresAt", data.expiresAt == null ? null : data.expiresAt.toLocalDateTime().toString());
        context.setVariable("inviteUrl", data.inviteUrl);
        return templateEngine.process("mail/group-invite", context);
    }

    public String renderGenericNotification(String recipientName, String subject, String message) {
        Context context = commonContext();
        context.setVariable("recipientName", recipientName);
        context.setVariable("subject", subject);
        context.setVariable("message", message);
        return templateEngine.process("mail/generic-notification", context);
    }

    private static Context commonContext() {
        Context context = new Context();
        context.setVariable("appName", "Expense Tracker");
        return context;
    }

    private static List<Map<String, Object>> toAmountMaps(List<Map<String, Object>> source) {
        if (source == null) return List.of();
        return source.stream().map(entry -> {
            Map<String, Object> copy = new LinkedHashMap<>(entry);
            if (entry.get("amount") instanceof BigDecimal amount) {
                copy.put("amount", MoneyFormatter.format(amount));
            }
            return copy;
        }).toList();
    }

    private static String formatPercent(double value) {
        return String.format("%.1f%%", value);
    }
}
