package com.expensetracker.budget;

import com.expensetracker.budget.dto.BudgetMemberSplit;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.expense.ExpenseService;
import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.expense.dto.SplitRequest;
import com.expensetracker.mail.EmailService;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.User;
import com.expensetracker.notification.NotificationSettingsService;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.GroupMemberRepository;
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
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Caps are slices of the group budget: the sum of member caps may never exceed
 * the group total, and a member may not add an expense whose share pushes them
 * past their cap — including stacking pending expenses before review.
 */
@SpringBootTest
@ActiveProfiles("h2")
class GroupBudgetCapIntegrationTest {

    @Autowired
    private GroupBudgetService budgetService;

    @Autowired
    private ExpenseService expenseService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ExpenseGroupRepository groupRepository;

    @Autowired
    private GroupMemberRepository groupMemberRepository;

    @Autowired
    private NotificationSettingsService settingsService;

    @MockBean
    private EmailService emailService;

    private User admin;
    private User member;
    private UUID groupId;
    private String month;

    @BeforeEach
    void setUp() {
        admin = saveUser("Cap Admin");
        member = saveUser("Cap Member");
        settingsService.ensureDefaults(admin.getId());
        settingsService.ensureDefaults(member.getId());

        ExpenseGroup group = new ExpenseGroup();
        group.setName("Cap Test Group");
        group.setCreatedBy(admin);
        group.setInviteCode("CAP" + UUID.randomUUID().toString().replace("-", "").substring(0, 8));
        group = groupRepository.save(group);
        groupId = group.getId();

        addMember(group, admin, "ADMIN", null);
        // Members get nothing by default; ADD_EXPENSE is granted explicitly.
        addMember(group, member, "MEMBER", "ADD_EXPENSE");

        month = LocalDate.now().withDayOfMonth(1).toString().substring(0, 7);
    }

    @Test
    void customSplitSummingAboveGroupBudgetIsRejected() {
        assertThatThrownBy(() -> budgetService.setGroupBudget(
                admin, groupId, new BigDecimal("1000.00"), "CUSTOM",
                List.of(split(admin.getId(), "600.00"), split(member.getId(), "600.00")), month))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds the group budget");
    }

    @Test
    void customSplitWithinGroupBudgetIsAccepted() {
        var status = budgetService.setGroupBudget(
                admin, groupId, new BigDecimal("1000.00"), "CUSTOM",
                List.of(split(admin.getId(), "600.00"), split(member.getId(), "400.00")), month);

        assertThat(status.getTotalBudget()).isEqualByComparingTo("1000.00");
    }

    @Test
    void memberCapCannotBeRaisedPastRemainingGroupBudget() {
        // EQUAL: 1000 split between two members -> 500 each.
        budgetService.setGroupBudget(admin, groupId, new BigDecimal("1000.00"), "EQUAL", null, month);

        assertThatThrownBy(() -> budgetService.setMemberBudget(
                admin, groupId, member.getId(), new BigDecimal("900.00"), month))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("exceeds the group budget");

        // Equal to the remaining budget is fine (500 + 500 = 1000).
        var dto = budgetService.setMemberBudget(
                admin, groupId, member.getId(), new BigDecimal("500.00"), month);
        assertThat(dto.getBudgetLimit()).isEqualByComparingTo("500.00");
    }

    @Test
    void memberCannotAddExpenseWhoseShareExceedsCap() {
        budgetService.setGroupBudget(admin, groupId, new BigDecimal("1000.00"), "EQUAL", null, month);

        // Member's cap is 500; this expense alone gives them a 600 share.
        assertThatThrownBy(() -> expenseService.createExpense(member, groupExpense(
                new BigDecimal("1200.00"),
                share(member.getId(), "600.00"),
                share(admin.getId(), "600.00"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("would exceed their monthly cap");
    }

    @Test
    void stackedPendingExpensesCannotExceedCap() {
        budgetService.setGroupBudget(admin, groupId, new BigDecimal("1000.00"), "EQUAL", null, month);

        // 400 of the member's 500 cap committed as PENDING.
        var first = expenseService.createExpense(member, groupExpense(
                new BigDecimal("800.00"),
                share(member.getId(), "400.00"),
                share(admin.getId(), "400.00")));
        assertThat(first.getStatus()).isEqualTo("PENDING");

        // A second pending expense would take the member to 600 > 500.
        assertThatThrownBy(() -> expenseService.createExpense(member, groupExpense(
                new BigDecimal("300.00"),
                share(member.getId(), "200.00"),
                share(admin.getId(), "100.00"))))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("would exceed their monthly cap");
    }

    // --- helpers ---

    private User saveUser(String name) {
        User user = new User();
        user.setFullName(name);
        user.setEmail(name.toLowerCase().replace(' ', '-') + "-" + UUID.randomUUID() + "@example.com");
        user.setPasswordHash("not-a-real-hash");
        return userRepository.save(user);
    }

    private void addMember(ExpenseGroup group, User user, String role, String permissions) {
        GroupMember gm = new GroupMember();
        gm.setGroup(group);
        gm.setUser(user);
        gm.setRole(role);
        gm.setStatus("ACTIVE");
        gm.setPermissions(permissions);
        groupMemberRepository.save(gm);
    }

    private BudgetMemberSplit split(UUID userId, String limit) {
        BudgetMemberSplit s = new BudgetMemberSplit();
        s.setUserId(userId);
        s.setBudgetLimit(new BigDecimal(limit));
        return s;
    }

    private SplitRequest share(UUID userId, String amount) {
        SplitRequest s = new SplitRequest();
        s.setUserId(userId);
        s.setShareAmount(new BigDecimal(amount));
        return s;
    }

    private CreateExpenseRequest groupExpense(BigDecimal total, SplitRequest... shares) {
        CreateExpenseRequest req = new CreateExpenseRequest();
        req.setAmount(total);
        req.setDescription("Cap test expense");
        req.setExpenseDate(LocalDate.now());
        req.setGroupId(groupId);
        req.setSplitType("CUSTOM");
        req.setSplits(List.of(shares));
        return req;
    }
}
