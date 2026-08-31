package com.expensetracker.budget;

import com.expensetracker.budget.dto.BudgetStatusResponse;
import com.expensetracker.budget.dto.SetBudgetRequest;
import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.UserBudgetRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.*;

@Service
public class BudgetService {

    private final UserBudgetRepository userBudgetRepository;
    private final CategoryRepository categoryRepository;
    private final ExpenseRepository expenseRepository;

    public BudgetService(
            UserBudgetRepository userBudgetRepository,
            CategoryRepository categoryRepository,
            ExpenseRepository expenseRepository) {
        this.userBudgetRepository = userBudgetRepository;
        this.categoryRepository = categoryRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional
    public BudgetStatusResponse setPersonalBudget(User user, SetBudgetRequest req, String monthParam) {
        LocalDate month = parseMonth(monthParam);

        UserBudget budget;
        if (req.getCategoryId() == null) {
            budget = userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(user.getId(), month)
                    .orElse(new UserBudget());
            budget.setUser(user);
            budget.setCategory(null);
        } else {
            Category cat = categoryRepository.findById(req.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + req.getCategoryId()));
            budget = userBudgetRepository.findByUserIdAndCategoryIdAndMonth(user.getId(), req.getCategoryId(), month)
                    .orElse(new UserBudget());
            budget.setUser(user);
            budget.setCategory(cat);
        }
        budget.setMonth(month);
        budget.setBudgetLimit(req.getBudgetLimit());
        UserBudget saved = userBudgetRepository.save(budget);

        BigDecimal spent = computePersonalSpent(user, saved);
        return BudgetStatusResponse.of(saved.getId(), month, saved.getBudgetLimit(), spent,
                saved.getCategory() != null ? saved.getCategory().getId() : null,
                saved.getCategory() != null ? saved.getCategory().getName() : null);
    }

    @Transactional(readOnly = true)
    public List<BudgetStatusResponse> getPersonalBudgetStatus(User user, String monthParam,
                                                              String year, String dateFrom, String dateTo) {
        LocalDate[] range = DateRangeResolver.resolve(monthParam, year, dateFrom, dateTo);
        LocalDate start = range[0];
        LocalDate end = range[1];

        // Single full month → return that month's budgets verbatim (id preserved).
        boolean fullMonth = start.getDayOfMonth() == 1
                && end.getDayOfMonth() == end.lengthOfMonth()
                && YearMonth.from(start).equals(YearMonth.from(end));
        if (fullMonth) {
            LocalDate month = start;
            List<UserBudget> budgets = userBudgetRepository.findByUserIdAndMonth(user.getId(), month);
            List<BudgetStatusResponse> responses = new ArrayList<>();
            for (UserBudget b : budgets) {
                BigDecimal spent;
                if (b.getCategory() == null) {
                    spent = expenseRepository.sumPersonalExpensesForMonth(user.getId(), start, end);
                } else {
                    spent = expenseRepository.sumPersonalExpensesByCategoryForMonth(
                            user.getId(), b.getCategory().getId(), start, end);
                }
                responses.add(BudgetStatusResponse.of(b.getId(), month, b.getBudgetLimit(), spent,
                        b.getCategory() != null ? b.getCategory().getId() : null,
                        b.getCategory() != null ? b.getCategory().getName() : null));
            }
            return responses;
        }

        // Aggregated view for year / custom range: sum monthly budgets per budget
        // slot, spent reflects the whole range.
        Map<UUID, BigDecimal> limits = new LinkedHashMap<>();
        Map<UUID, String> categoryNames = new LinkedHashMap<>();
        BigDecimal overallLimit = BigDecimal.ZERO;
        boolean hasOverall = false;

        YearMonth ym = YearMonth.from(start);
        YearMonth endYm = YearMonth.from(end);
        while (!ym.isAfter(endYm)) {
            List<UserBudget> budgets = userBudgetRepository.findByUserIdAndMonth(user.getId(), ym.atDay(1));
            for (UserBudget b : budgets) {
                if (b.getCategory() == null) {
                    overallLimit = overallLimit.add(b.getBudgetLimit());
                    hasOverall = true;
                } else {
                    UUID catId = b.getCategory().getId();
                    limits.merge(catId, b.getBudgetLimit(), BigDecimal::add);
                    categoryNames.put(catId, b.getCategory().getName());
                }
            }
            ym = ym.plusMonths(1);
        }

        List<BudgetStatusResponse> responses = new ArrayList<>();
        if (hasOverall) {
            BigDecimal spent = expenseRepository.sumPersonalExpensesForMonth(user.getId(), start, end);
            responses.add(BudgetStatusResponse.of(null, start, overallLimit, spent, null, null));
        }
        for (Map.Entry<UUID, BigDecimal> e : limits.entrySet()) {
            BigDecimal spent = expenseRepository.sumPersonalExpensesByCategoryForMonth(
                    user.getId(), e.getKey(), start, end);
            responses.add(BudgetStatusResponse.of(null, start, e.getValue(), spent,
                    e.getKey(), categoryNames.get(e.getKey())));
        }
        return responses;
    }

    // --- helpers ---

    private BigDecimal computePersonalSpent(User user, UserBudget budget) {
        LocalDate start = budget.getMonth().withDayOfMonth(1);
        LocalDate end = budget.getMonth().withDayOfMonth(budget.getMonth().lengthOfMonth());
        if (budget.getCategory() == null) {
            return expenseRepository.sumPersonalExpensesForMonth(user.getId(), start, end);
        }
        return expenseRepository.sumPersonalExpensesByCategoryForMonth(
                user.getId(), budget.getCategory().getId(), start, end);
    }

    public static LocalDate parseMonth(String monthParam) {
        if (monthParam == null || monthParam.isBlank()) return LocalDate.now().withDayOfMonth(1);
        String[] parts = monthParam.split("-");
        return LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
    }
}
