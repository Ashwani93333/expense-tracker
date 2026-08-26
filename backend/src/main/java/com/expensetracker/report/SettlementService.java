package com.expensetracker.report;

import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.model.Expense;
import com.expensetracker.model.ExpenseSplit;
import com.expensetracker.report.dto.SettlementSummaryDto;
import com.expensetracker.repository.ExpenseRepository;
import com.expensetracker.repository.ExpenseSplitRepository;
import com.expensetracker.repository.GroupMemberRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

@Service
public class SettlementService {

    private final ExpenseRepository expenseRepository;
    private final ExpenseSplitRepository splitRepository;
    private final GroupMemberRepository groupMemberRepository;

    public SettlementService(
            ExpenseRepository expenseRepository,
            ExpenseSplitRepository splitRepository,
            GroupMemberRepository groupMemberRepository) {
        this.expenseRepository = expenseRepository;
        this.splitRepository = splitRepository;
        this.groupMemberRepository = groupMemberRepository;
    }

    /**
     * Computes "who owes whom" net amounts for a group in a given month.
     *
     * Algorithm:
     * 1. For each group expense, the payer paid full amount.
     * 2. Each split user owes their share to the payer.
     * 3. We accumulate a net balance map: positive = you are owed, negative = you owe.
     * 4. We resolve the net balances into minimal transfer pairs.
     */
    @Transactional(readOnly = true)
    public List<SettlementSummaryDto> computeSettlements(UUID userId, UUID groupId, String monthParam) {
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, userId, "ACTIVE");
        if (!isMember) throw new AccessDeniedException("You are not a member of this group");

        LocalDate[] range = parseMonthRange(monthParam);
        List<ExpenseSplit> splits = splitRepository.findByGroupAndMonth(groupId, range[0], range[1]);
        List<Expense> expenses = expenseRepository.findByGroupIdAndStatusAndExpenseDateBetweenOrderByExpenseDateDesc(
                groupId, "APPROVED", range[0], range[1]);

        // paidBy map: expenseId → paidBy user
        Map<UUID, UUID> paidByMap = new HashMap<>();
        Map<UUID, String> paidByNameMap = new HashMap<>();
        for (Expense e : expenses) {
            if (e.getPaidBy() != null) {
                paidByMap.put(e.getId(), e.getPaidBy().getId());
                paidByNameMap.put(e.getPaidBy().getId(), e.getPaidBy().getFullName());
            }
        }

        // net[A][B] = amount A owes B (after offsetting in both directions)
        // We use a simpler Map<UUID, BigDecimal> balance: positive = owed to you, negative = you owe
        Map<UUID, BigDecimal> balance = new HashMap<>();
        Map<UUID, String> nameMap = new HashMap<>();

        for (ExpenseSplit split : splits) {
            if (Boolean.TRUE.equals(split.getIsSettled())) continue;

            UUID debtorId = split.getUser().getId();
            nameMap.put(debtorId, split.getUser().getFullName());

            UUID payerId = paidByMap.get(split.getExpense().getId());
            if (payerId == null || payerId.equals(debtorId)) continue; // self-paid or unknown

            BigDecimal amount = split.getShareAmount();

            // debtor owes payer: balance[debtor] -= amount, balance[payer] += amount
            balance.merge(debtorId, amount.negate(), BigDecimal::add);
            balance.merge(payerId, amount, BigDecimal::add);
            nameMap.putIfAbsent(payerId, paidByNameMap.getOrDefault(payerId, "Unknown"));
        }

        // Resolve net balances into minimal transfers
        return resolveBalances(balance, nameMap);
    }

    private List<SettlementSummaryDto> resolveBalances(
            Map<UUID, BigDecimal> balance, Map<UUID, String> nameMap) {

        List<Map.Entry<UUID, BigDecimal>> creditors = new ArrayList<>(); // balance > 0
        List<Map.Entry<UUID, BigDecimal>> debtors = new ArrayList<>();   // balance < 0

        for (Map.Entry<UUID, BigDecimal> entry : balance.entrySet()) {
            if (entry.getValue().compareTo(BigDecimal.ZERO) > 0) {
                creditors.add(entry);
            } else if (entry.getValue().compareTo(BigDecimal.ZERO) < 0) {
                debtors.add(entry);
            }
        }

        // Sort descending for greedy matching
        creditors.sort((a, b) -> b.getValue().compareTo(a.getValue()));
        debtors.sort((a, b) -> a.getValue().compareTo(b.getValue())); // most negative first

        List<SettlementSummaryDto> result = new ArrayList<>();
        int ci = 0, di = 0;
        BigDecimal[] creditAmounts = creditors.stream()
                .map(Map.Entry::getValue).toArray(BigDecimal[]::new);
        BigDecimal[] debtAmounts = debtors.stream()
                .map(e -> e.getValue().negate()).toArray(BigDecimal[]::new);

        while (ci < creditors.size() && di < debtors.size()) {
            BigDecimal transfer = creditAmounts[ci].min(debtAmounts[di]);
            if (transfer.compareTo(new BigDecimal("0.01")) >= 0) {
                result.add(new SettlementSummaryDto(
                        debtors.get(di).getKey(),
                        nameMap.getOrDefault(debtors.get(di).getKey(), "Unknown"),
                        creditors.get(ci).getKey(),
                        nameMap.getOrDefault(creditors.get(ci).getKey(), "Unknown"),
                        transfer.setScale(2, java.math.RoundingMode.HALF_UP)
                ));
            }
            creditAmounts[ci] = creditAmounts[ci].subtract(transfer);
            debtAmounts[di] = debtAmounts[di].subtract(transfer);
            if (creditAmounts[ci].compareTo(BigDecimal.ZERO) == 0) ci++;
            if (debtAmounts[di].compareTo(BigDecimal.ZERO) == 0) di++;
        }

        return result;
    }

    private LocalDate[] parseMonthRange(String month) {
        if (month == null || month.isBlank()) {
            LocalDate now = LocalDate.now();
            return new LocalDate[]{now.withDayOfMonth(1), now.withDayOfMonth(now.lengthOfMonth())};
        }
        String[] parts = month.split("-");
        LocalDate first = LocalDate.of(Integer.parseInt(parts[0]), Integer.parseInt(parts[1]), 1);
        return new LocalDate[]{first, first.withDayOfMonth(first.lengthOfMonth())};
    }
}
