package com.expensetracker.income;

import com.expensetracker.common.DateRangeResolver;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.group.GroupPermission;
import com.expensetracker.group.GroupRoleGuard;
import com.expensetracker.income.dto.CreateIncomeRequest;
import com.expensetracker.income.dto.IncomeDto;
import com.expensetracker.income.dto.UpdateIncomeRequest;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.model.Income;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.IncomeRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class IncomeService {

    private final IncomeRepository incomeRepository;
    private final ExpenseRepository expenseRepository;
    private final ExpenseGroupRepository groupRepository;
    private final GroupRoleGuard roleGuard;

    public IncomeService(IncomeRepository incomeRepository, ExpenseRepository expenseRepository,
                         ExpenseGroupRepository groupRepository, GroupRoleGuard roleGuard) {
        this.incomeRepository = incomeRepository;
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.roleGuard = roleGuard;
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
        return incomeRepository.findByUserIdAndGroupIsNullAndIncomeDateBetweenOrderByIncomeDateDesc(
                        user.getId(), range[0], range[1])
                .stream()
                .map(IncomeDto::fromEntity)
                .collect(Collectors.toList());
    }

    // ---- Group income ----

    @Transactional
    public IncomeDto createGroupIncome(User user, UUID groupId, CreateIncomeRequest req) {
        ExpenseGroup group = groupRepository.findById(groupId)
                .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + groupId));
        if (!Boolean.TRUE.equals(group.getIsActive())) {
            throw new BadRequestException("This group is no longer active");
        }
        if (group.getExpiresAt() != null && group.getExpiresAt().isBefore(OffsetDateTime.now())) {
            throw new BadRequestException("This group has expired and no longer accepts income entries");
        }
        // Active membership + the admin-granted ADD_INCOME feature.
        roleGuard.requirePermission(groupId, user.getId(), GroupPermission.ADD_INCOME);

        Income income = new Income();
        income.setUser(user);
        income.setGroup(group);
        income.setAmount(req.getAmount());
        income.setDescription(req.getDescription());
        income.setIncomeDate(req.getIncomeDate());
        income.setSource(req.getSource());
        income.setIsRecurring(Boolean.TRUE.equals(req.getIsRecurring()));
        income.setFrequency(req.getFrequency());
        income.setNotes(req.getNotes());

        return IncomeDto.fromEntity(incomeRepository.save(income));
    }

    /**
     * Group admins see every member's income (with source); regular members only
     * see the entries they added themselves.
     */
    @Transactional(readOnly = true)
    public List<IncomeDto> getGroupIncomes(User user, UUID groupId, String month, String year,
                                           String dateFrom, String dateTo) {
        GroupMember me = roleGuard.requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(month, year, dateFrom, dateTo);
        boolean isAdmin = "ADMIN".equals(me.getRole());
        List<Income> incomes = isAdmin
                ? incomeRepository.findByGroupIdAndIncomeDateBetweenOrderByIncomeDateDesc(groupId, range[0], range[1])
                : incomeRepository.findByGroupIdAndUserIdAndIncomeDateBetweenOrderByIncomeDateDesc(
                        groupId, user.getId(), range[0], range[1]);
        return incomes.stream().map(IncomeDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getGroupIncomeSummary(User user, UUID groupId, String month, String year,
                                                     String dateFrom, String dateTo) {
        roleGuard.requireMember(groupId, user.getId());
        LocalDate[] range = DateRangeResolver.resolve(month, year, dateFrom, dateTo);
        BigDecimal total = incomeRepository.sumGroupIncomeForPeriod(groupId, range[0], range[1]);
        long count = incomeRepository.countByGroupIdAndIncomeDateBetween(groupId, range[0], range[1]);

        List<Map<String, Object>> sourceList = incomeRepository
                .groupSourceBreakdown(groupId, range[0], range[1]).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("source", row[0] != null ? row[0].toString() : "OTHER");
                    m.put("total", row[1]);
                    return m;
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> memberList = incomeRepository
                .groupMemberBreakdown(groupId, range[0], range[1]).stream()
                .map(row -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("userId", row[0] != null ? row[0].toString() : null);
                    m.put("userName", row[1] != null ? row[1].toString() : "Unknown");
                    m.put("total", row[2]);
                    m.put("count", row[3]);
                    return m;
                })
                .collect(Collectors.toList());

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dateFrom", range[0].toString());
        result.put("dateTo", range[1].toString());
        result.put("label", DateRangeResolver.describeRange(range[0], range[1]));
        result.put("totalIncome", total);
        result.put("count", count);
        result.put("sourceBreakdown", sourceList);
        result.put("memberBreakdown", memberList);
        return result;
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
