package com.expensetracker.budget;

import com.expensetracker.expense.ExpenseService;
import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.mail.EmailService;
import com.expensetracker.model.Notification;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.notification.NotificationSettingsService;
import com.expensetracker.notification.dto.UpdateNotificationSettingsRequest;
import com.expensetracker.repository.NotificationRepository;
import com.expensetracker.repository.UserBudgetRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

/**
 * End-to-end check that creating an expense which crosses a configured budget
 * threshold produces an in-app notification and triggers the (mocked) email
 * channel exactly once — no duplicates on subsequent expenses in the same
 * threshold window.
 */
@SpringBootTest
@ActiveProfiles("h2")
class BudgetNotificationIntegrationTest {

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserBudgetRepository userBudgetRepository;

    @Autowired
    private NotificationRepository notificationRepository;

    @Autowired
    private NotificationSettingsService settingsService;

    @MockBean
    private EmailService emailService;

    private User user;
    private UUID budgetId;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setFullName("Budget Tester");
        user.setEmail("budget-" + UUID.randomUUID() + "@example.com");
        user.setPasswordHash("not-a-real-hash");
        user = userRepository.save(user);

        settingsService.ensureDefaults(user.getId());
        UpdateNotificationSettingsRequest req = new UpdateNotificationSettingsRequest();
        req.setOverallBudgetThresholds(List.of(50, 100));
        settingsService.updateSettings(user.getId(), req);

        UserBudget budget = new UserBudget();
        budget.setUser(user);
        budget.setMonth(LocalDate.now().withDayOfMonth(1));
        budget.setBudgetLimit(new BigDecimal("1000.00"));
        budgetId = userBudgetRepository.save(budget).getId();
    }

    @Test
    void crossingThresholdCreatesInAppNotificationAndSendsEmail() {
        expense(user, "600.00"); // 60% of 1000 -> threshold 50 crossed

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertThat(notifications).hasSize(1);
        Notification n = notifications.get(0);
        assertThat(n.getType()).isEqualTo("BUDGET_THRESHOLD_REACHED");
        assertThat(n.getReferenceType()).isEqualTo("USER_BUDGET");
        assertThat(n.getReferenceId()).isEqualTo(budgetId);
        assertThat(n.getIsRead()).isFalse();

        verify(emailService).sendBudgetAlertEmail(eq(user.getEmail()), eq(user.getFullName()), any());
    }

    @Test
    void sameThresholdIsReportedOnlyOnceButHigherThresholdStillFires() {
        expense(user, "600.00"); // 60% -> threshold 50
        expense(user, "100.00"); // 70% -> same threshold 50, must be deduped

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).hasSize(1);

        expense(user, "500.00"); // 120% -> threshold 100 crossed

        List<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        assertThat(notifications).hasSize(2);
        assertThat(notifications)
                .extracting(Notification::getType)
                .containsExactlyInAnyOrder("BUDGET_THRESHOLD_REACHED", "BUDGET_EXCEEDED");
    }

    @Test
    void disabledOverallBudgetAlertsProduceNoNotification() {
        UpdateNotificationSettingsRequest req = new UpdateNotificationSettingsRequest();
        req.setOverallBudgetEnabled(false);
        settingsService.updateSettings(user.getId(), req);

        expense(user, "600.00");

        assertThat(notificationRepository.findByUserIdOrderByCreatedAtDesc(user.getId())).isEmpty();
    }

    private void expense(User user, String amount) {
        CreateExpenseRequest req = new CreateExpenseRequest();
        req.setAmount(new BigDecimal(amount));
        req.setDescription("Test expense " + amount);
        req.setExpenseDate(LocalDate.now());
        expenseService.createExpense(user, req);
    }
}
