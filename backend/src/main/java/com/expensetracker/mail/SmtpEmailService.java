package com.expensetracker.mail;

import com.expensetracker.mail.EmailService.BudgetAlertEmailData;
import com.expensetracker.mail.EmailService.CategoryBudgetAlertEmailData;
import com.expensetracker.mail.EmailService.GroupInviteEmailData;
import com.expensetracker.mail.EmailService.MonthlySummaryEmailData;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Default {@link EmailService} backed by {@link JavaMailSender} and the Thymeleaf
 * templates. Email delivery problems are never allowed to roll back business
 * transactions — failures are logged and reported to the caller.
 */
@Service
public class SmtpEmailService implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(SmtpEmailService.class);

    private final JavaMailSender mailSender;
    private final EmailTemplateService templateService;

    @Value("${app.mail.from:no-reply@expense-tracker.local}")
    private String from;

    @Value("${app.mail.from-name:Expense Tracker}")
    private String fromName;

    public SmtpEmailService(JavaMailSender mailSender, EmailTemplateService templateService) {
        this.mailSender = mailSender;
        this.templateService = templateService;
    }

    @Override
    public void sendSimpleEmail(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to);
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (MailException e) {
            log.error("Failed to send simple email to {}", to, e);
        }
    }

    @Override
    public void sendHtmlEmail(String to, String subject, String html) {
        sendHtml(to, subject, html);
    }

    @Override
    public boolean sendBudgetAlertEmail(String to, String recipientName, BudgetAlertEmailData data) {
        return sendHtml(to, "Budget Alert — " + data.title, templateService.renderBudgetAlert(data));
    }

    @Override
    public boolean sendCategoryBudgetAlertEmail(String to, String recipientName, CategoryBudgetAlertEmailData data) {
        return sendHtml(to, "Category Budget Alert — " + data.categoryName,
                templateService.renderCategoryBudgetAlert(data));
    }

    @Override
    public boolean sendMonthlySummaryEmail(String to, String recipientName, MonthlySummaryEmailData data) {
        return sendHtml(to, "Your Monthly Expense Summary — " + data.monthLabel,
                templateService.renderMonthlySummary(data));
    }

    @Override
    public boolean sendGroupInviteEmail(String to, GroupInviteEmailData data) {
        return sendHtml(to, "You've been invited to join " + data.groupName + " on " + "Expense Tracker",
                templateService.renderGroupInvite(data));
    }

    @Override
    public boolean sendGenericNotificationEmail(String to, String recipientName, String subject, String message) {
        String html = templateService.renderGenericNotification(recipientName, subject, message);
        return sendHtml(to, subject, html);
    }

    private boolean sendHtml(String to, String subject, String html) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, false, StandardCharsets.UTF_8.name());
            helper.setFrom(from, fromName);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(html, true);
            mailSender.send(message);
            return true;
        } catch (MessagingException | MailException | java.io.UnsupportedEncodingException e) {
            log.error("Failed to send HTML email to {} (subject: {})", to, subject, e);
            return false;
        }
    }
}
