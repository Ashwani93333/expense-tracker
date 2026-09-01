package com.expensetracker.income;

import com.expensetracker.income.dto.CreateIncomeRequest;
import com.expensetracker.income.dto.IncomeDto;
import com.expensetracker.income.dto.UpdateIncomeRequest;
import com.expensetracker.model.Role;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("h2")
public class IncomeServiceTest {

    @Autowired
    private IncomeService incomeService;

    @Autowired
    private UserRepository userRepository;

    private User user;

    @BeforeEach
    public void setUp() {
        user = userRepository.save(User.builder()
                .fullName("Income Test User")
                .email("income-test-" + UUID.randomUUID() + "@example.com")
                .passwordHash("dummy-hash")
                .role(Role.ROLE_USER)
                .build());
    }

    private CreateIncomeRequest buildRequest(BigDecimal amount, String description,
                                             LocalDate date, IncomeSource source) {
        CreateIncomeRequest req = new CreateIncomeRequest();
        req.setAmount(amount);
        req.setDescription(description);
        req.setIncomeDate(date);
        req.setSource(source);
        req.setIsRecurring(true);
        req.setFrequency("MONTHLY");
        return req;
    }

    @Test
    public void testCreateIncome() {
        CreateIncomeRequest req = buildRequest(
                new BigDecimal("50000.00"), "March salary",
                LocalDate.now(), IncomeSource.SALARY);

        IncomeDto dto = incomeService.createIncome(user, req);

        assertNotNull(dto.getId());
        assertEquals(0, dto.getAmount().compareTo(new BigDecimal("50000.00")));
        assertEquals("March salary", dto.getDescription());
        assertEquals(IncomeSource.SALARY, dto.getSource());
        assertEquals("Salary", dto.getSourceLabel());
        assertTrue(dto.getIsRecurring());
        assertEquals("MONTHLY", dto.getFrequency());
        assertEquals(user.getId(), dto.getUserId());
    }

    @Test
    public void testListIncomesFilteredByMonth() {
        LocalDate thisMonth = LocalDate.now();
        incomeService.createIncome(user, buildRequest(new BigDecimal("1000.00"), "Salary", thisMonth, IncomeSource.SALARY));
        incomeService.createIncome(user, buildRequest(new BigDecimal("2000.00"), "Freelance", thisMonth, IncomeSource.FREELANCE));
        incomeService.createIncome(user, buildRequest(
                new BigDecimal("9999.00"), "Old income",
                thisMonth.minusMonths(2), IncomeSource.OTHER));

        String month = "%d-%02d".formatted(thisMonth.getYear(), thisMonth.getMonthValue());
        List<IncomeDto> list = incomeService.getPersonalIncomes(user, month, null, null, null);

        assertEquals(2, list.size());
        assertTrue(list.stream().noneMatch(i -> "Old income".equals(i.getDescription())));
    }

    @Test
    public void testIncomeSummaryAndSourceBreakdown() {
        LocalDate now = LocalDate.now();
        incomeService.createIncome(user, buildRequest(new BigDecimal("30000.00"), "Salary", now, IncomeSource.SALARY));
        incomeService.createIncome(user, buildRequest(new BigDecimal("10000.00"), "Freelance project", now, IncomeSource.FREELANCE));

        Map<String, Object> summary = incomeService.getIncomeSummary(user, null, null, null, null);

        assertEquals(0, ((BigDecimal) summary.get("totalIncome")).compareTo(new BigDecimal("40000.00")));
        assertEquals(2, ((Number) summary.get("count")).longValue());
        assertEquals(2, ((List<?>) summary.get("sourceBreakdown")).size());
    }

    @Test
    public void testFinancialOverviewShowsIncomeExpenseAndNet() {
        LocalDate now = LocalDate.now();
        incomeService.createIncome(user, buildRequest(new BigDecimal("50000.00"), "Salary", now, IncomeSource.SALARY));

        Map<String, Object> overview = incomeService.getFinancialOverview(user, null, null, null, null);

        assertEquals(0, ((BigDecimal) overview.get("totalIncome")).compareTo(new BigDecimal("50000.00")));
        assertEquals(0, ((BigDecimal) overview.get("totalExpenses")).compareTo(BigDecimal.ZERO));
        assertEquals(0, ((BigDecimal) overview.get("netBalance")).compareTo(new BigDecimal("50000.00")));
    }

    @Test
    public void testUpdateIncome() {
        IncomeDto created = incomeService.createIncome(user, buildRequest(
                new BigDecimal("10000.00"), "Initial", LocalDate.now(), IncomeSource.OTHER));

        UpdateIncomeRequest update = new UpdateIncomeRequest();
        update.setAmount(new BigDecimal("15000.00"));
        update.setSource(IncomeSource.FREELANCE);

        IncomeDto updated = incomeService.updateIncome(user, created.getId(), update);

        assertEquals(0, updated.getAmount().compareTo(new BigDecimal("15000.00")));
        assertEquals(IncomeSource.FREELANCE, updated.getSource());
        assertEquals("Freelance", updated.getSourceLabel());
        assertEquals("Initial", updated.getDescription());
    }

    @Test
    public void testDeleteIncome() {
        IncomeDto created = incomeService.createIncome(user, buildRequest(
                new BigDecimal("5000.00"), "To delete", LocalDate.now(), IncomeSource.GIFTS));

        incomeService.deleteIncome(user, created.getId());

        assertThrows(com.expensetracker.exception.ResourceNotFoundException.class,
                () -> incomeService.getIncomeById(user, created.getId()));
    }

    @Test
    public void testAccessDeniedForAnotherUser() {
        User other = userRepository.save(User.builder()
                .fullName("Other User")
                .email("other-" + UUID.randomUUID() + "@example.com")
                .passwordHash("dummy-hash")
                .role(Role.ROLE_USER)
                .build());

        IncomeDto created = incomeService.createIncome(user, buildRequest(
                new BigDecimal("1000.00"), "Salary", LocalDate.now(), IncomeSource.SALARY));

        assertThrows(com.expensetracker.exception.AccessDeniedException.class,
                () -> incomeService.getIncomeById(other, created.getId()));
        assertThrows(com.expensetracker.exception.AccessDeniedException.class,
                () -> incomeService.deleteIncome(other, created.getId()));
    }
}