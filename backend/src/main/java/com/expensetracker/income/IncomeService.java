package com.expensetracker.income;

import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.income.dto.CreateIncomeRequest;
import com.expensetracker.income.dto.IncomeDto;
import com.expensetracker.income.dto.UpdateIncomeRequest;
import com.expensetracker.model.Income;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IncomeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;

    public IncomeService(IncomeRepository incomeRepository, ExpenseRepository expenseRepository) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
    }

    @Transactional
    public IncomeDto createIncome(User user, CreateIncomeRequest req) {
        Income income = new Income();
        income.setUser(user);
        income.setAmount(req.getAmount());
        income.setDescription(req.getDescription());
        income.setIncomeDate(req.getIncomeDate());
        income.setSource(req.getSource());
        income.setIsRecurring(Boolean.TRUE.equals(req.getIsRecurring()));
        income.setFrequency(req.getFrequency());
        income.setNotes(req.getNotes());

        Income saved = incomeRepository.save(income);
        return IncomeDto.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public List<IncomeDto> getPersonalIncomes(User user, String month, String year,
                                               String dateFrom, String dateTo) {
        LocalDate[] range = DateRangeResolver.resolve(month, year, dateFrom, dateTo);
        return incomeRepository.findByUserIdAndIncomeDateBetweenOrderByIncomeDateDesc(
                        user.getId(), range[0], range[1])
                .stream()
                .map(IncomeDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public IncomeDto getIncomeById(User user, UUID incomeId) {
        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found: " + incomeId));
        if (!income.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not have access to this income");
        }
        return IncomeDto.fromEntity(income);
    }

    @Transactional
    public IncomeDto updateIncome(User user, UUID incomeId, UpdateIncomeRequest req) {
        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found: " + incomeId));
        if (!income.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only edit your own income entries");
        }

        if (req.getAmount() != null) income.setAmount(req.getAmount());
        if (req.getDescription() != null) income.setDescription(req.getDescription());
        if (req.getIncomeDate() != null) income.setIncomeDate(req.getIncomeDate());
        if (req.getSource() != null) income.setSource(req.getSource());
        if (req.getIsRecurring() != null) income.setIsRecurring(req.getIsRecurring());
        if (req.getFrequency() != null) income.setFrequency(req.getFrequency());
        if (req.getNotes() != null) income.setNotes(req.getNotes());

        Income saved = incomeRepository.save(income);
        return IncomeDto.fromEntity(saved);
    }

    @Transactional
    public void deleteIncome(User user, UUID incomeId) {
        Income income = incomeRepository.findById(incomeId)
                .orElseThrow(() -> new ResourceNotFoundException("Income not found: " + incomeId));
        if (!income.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only delete your own income entries");
        }
        incomeRepository.delete(income);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getIncomeSummary(User user, String month, String year,
                                                 String dateFrom, String dateTo) {
        LocalDate[] range = DateRangeResolver.resolve(month, year, dateFrom, dateTo);
        BigDecimal total = incomeRepository.sumIncomeForPeriod(user.getId(), range[0], range[1]);
        long count = incomeRepository.countByUserIdAndIncomeDateBetween(user.getId(), range[0], range[1]);
        List<Object[]> breakdown = incomeRepository.sourceBreakdown(user.getId(), range[0], range[1]);

        List<Map<String, Object>> sourceList = breakdown.stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("source", row[0] != null ? row[0].toString() : "OTHER");
                    m.put("total", row[1]);
                    return m;
                })
                .collect(Collectors.toList());

        return Map.of(
                "dateFrom", range[0].toString(),
                "dateTo", range[1].toString(),
                "label", DateRangeResolver.describeRange(range[0], range[1]),
                "totalIncome", total,
                "count", count,
                "sourceBreakdown", sourceList
        );
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getFinancialOverview(User user, String month, String year,
                                                     String dateFrom, String dateTo) {
        LocalDate[] range = DateRangeResolver.resolve(month, year, dateFrom, dateTo);
        BigDecimal totalIncome = incomeRepository.sumIncomeForPeriod(user.getId(), range[0], range[1]);
        BigDecimal totalExpenses = expenseRepository.sumPersonalExpensesForMonth(user.getId(), range[0], range[1]);
        BigDecimal netBalance = totalIncome.subtract(totalExpenses);

        return Map.of(
                "dateFrom", range[0].toString(),
                "dateTo", range[1].toString(),
                "label", DateRangeResolver.describeRange(range[0], range[1]),
                "totalIncome", totalIncome,
                "totalExpenses", totalExpenses,
                "netBalance", netBalance
        );
    }
}
