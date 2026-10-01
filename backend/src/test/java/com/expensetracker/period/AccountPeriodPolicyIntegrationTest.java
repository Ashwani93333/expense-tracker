package com.expensetracker.period;

import com.expensetracker.budget.BudgetService;
import com.expensetracker.budget.dto.SetBudgetRequest;
import com.expensetracker.expense.ExpenseService;
import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.Role;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.YearMonth;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * An account has no history before it was created, so it must not be able to
 * record spend or budgets for periods that predate it. Future periods stay open
 * so users can plan ahead.
 */
@SpringBootTest
@ActiveProfiles("h2")
class AccountPeriodPolicyIntegrationTest {

    @Autowired
    private AccountPeriodPolicy policy;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private BudgetService budgetService;

    @Autowired
    private UserRepository userRepository;

    /** Keeps the test free of real mail delivery. */
    @MockBean
    private com.expensetracker.mail.EmailService emailService;

    private User user;
    private LocalDate earliest;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setFullName("Fresh Start");
        user.setEmail("fresh-" + UUID.randomUUID() + "@example.com");
        user.setPasswordHash("hash");
        user.setRole(Role.ROLE_USER);
        user = userRepository.save(user);

        // Signed up today: the whole current month is inside the account.
        earliest = policy.earliestDate(user);
    }

    @Test
    void floorIsTheFirstDayOfTheSignupMonth() {
        assertThat(earliest.getDayOfMonth()).isEqualTo(1);
        assertThat(YearMonth.from(earliest)).isEqualTo(YearMonth.now());
    }

    @Test
    void signupMonthAndFutureDatesAreAllowed() {
        assertThat(policy.isDateAllowed(user, LocalDate.now())).isTrue();
        assertThat(policy.isDateAllowed(user, LocalDate.now().plusYears(2))).isTrue();
        assertThat(policy.isMonthAllowed(user, YearMonth.now().plusMonths(3))).isTrue();
    }

    @Test
    void datesBeforeSignupAreRejected() {
        LocalDate tooEarly = earliest.minusDays(1);
        assertThat(policy.isDateAllowed(user, tooEarly)).isFalse();
        assertThatThrownBy(() -> policy.requireDateAllowed(user, tooEarly, "An expense"))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("your account started");
    }

    @Test
    void creatingAnExpenseBeforeSignupIsRejected() {
        assertThatThrownBy(() -> expenseService.createExpense(user, expenseOn(earliest.minusMonths(2))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("before");
    }

    @Test
    void creatingAnExpenseInsideTheAccountIsAllowed() {
        assertThatCode(() -> expenseService.createExpense(user, expenseOn(earliest)))
                .doesNotThrowAnyException();
    }

    @Test
    void settingABudgetForAPastMonthIsRejected() {
        String pastMonth = YearMonth.from(earliest).minusMonths(1).toString();
        SetBudgetRequest req = new SetBudgetRequest();
        req.setBudgetLimit(new BigDecimal("5000"));

        assertThatThrownBy(() -> budgetService.setPersonalBudget(user, req, pastMonth))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("cannot be set for");
    }

    @Test
    void settingABudgetForAFutureMonthIsAllowed() {
        SetBudgetRequest req = new SetBudgetRequest();
        req.setBudgetLimit(new BigDecimal("5000"));
        String futureMonth = YearMonth.now().plusMonths(1).toString();

        assertThatCode(() -> budgetService.setPersonalBudget(user, req, futureMonth))
                .doesNotThrowAnyException();
    }

    @Test
    void unknownCreationTimeStaysPermissive() {
        User legacy = new User();
        legacy.setFullName("Legacy");
        legacy.setEmail("legacy-" + UUID.randomUUID() + "@example.com");
        legacy.setPasswordHash("hash");
        legacy.setRole(Role.ROLE_USER);
        legacy.setCreatedAt(OffsetDateTime.now(ZoneOffset.UTC).minusYears(3));

        assertThat(policy.isDateAllowed(legacy, LocalDate.now().minusYears(2))).isTrue();
    }

    private CreateExpenseRequest expenseOn(LocalDate date) {
        CreateExpenseRequest req = new CreateExpenseRequest();
        req.setAmount(new BigDecimal("120.50"));
        req.setDescription("Backdated coffee");
        req.setExpenseDate(date);
        return req;
    }
}
