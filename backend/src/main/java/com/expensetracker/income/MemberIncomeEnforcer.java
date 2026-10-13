package com.expensetracker.income;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.ExpenseSplit;
import com.expensetracker.repository.ExpenseSplitRepository;
import com.expensetracker.repository.IncomeRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Hard-enforces the income limit for groups managed by income. A member can
 * never have more of their share counted toward an expense than the income they
 * recorded in the group for that month. Members with no income are therefore
 * unable to spend until they log income.
 *
 * <p>Mirrors {@link com.expensetracker.budget.MemberBudgetCapEnforcer}: the
 * check is projection-based, taking the spend already on the books (excluding
 * the expense currently being written) and rejecting the write when the new
 * share would push the member past their income.
 */
@Service
public class MemberIncomeEnforcer {

    private final IncomeRepository incomeRepository;
    private final ExpenseSplitRepository splitRepository;

    public MemberIncomeEnforcer(IncomeRepository incomeRepository,
                                ExpenseSplitRepository splitRepository) {
        this.incomeRepository = incomeRepository;
        this.splitRepository = splitRepository;
    }

    public void enforceIncome(UUID groupId, LocalDate expenseDate, UUID excludeExpenseId,
                              List<ExpenseSplit> splits) {
        enforce(groupId, expenseDate, excludeExpenseId, splits, false);
    }

    /**
     * Creation-time variant: pending shares count too, so a member cannot stack
     * multiple pending expenses that together exceed their income while waiting
     * for review.
     */
    public void enforceIncomeAtCreation(UUID groupId, LocalDate expenseDate, UUID excludeExpenseId,
                                        List<ExpenseSplit> splits) {
        enforce(groupId, expenseDate, excludeExpenseId, splits, true);
    }

    private void enforce(UUID groupId, LocalDate expenseDate, UUID excludeExpenseId,
                         List<ExpenseSplit> splits, boolean includePending) {
        if (splits == null || splits.isEmpty() || excludeExpenseId == null) {
            return;
        }
        LocalDate start = expenseDate.withDayOfMonth(1);
        LocalDate end = expenseDate.withDayOfMonth(expenseDate.lengthOfMonth());

        for (ExpenseSplit split : splits) {
            if (split.getShareAmount() == null) {
                continue;
            }
            BigDecimal income = incomeRepository.sumGroupIncomeForMemberForMonth(
                    groupId, split.getUser().getId(), start, end);
            BigDecimal spent = includePending
                    ? splitRepository.sumMemberShareInGroupForMonthExcludingCommitted(
                            split.getUser().getId(), groupId, excludeExpenseId, start, end)
                    : splitRepository.sumMemberShareInGroupForMonthExcluding(
                            split.getUser().getId(), groupId, excludeExpenseId, start, end);
            BigDecimal projected = spent.add(split.getShareAmount());
            if (projected.compareTo(income) > 0) {
                String basis = includePending ? "already spent or pending" : "already spent";
                throw new BadRequestException(
                        split.getUser().getFullName() + " can only spend up to their income of ₹"
                        + income + " in this group (₹" + spent + " " + basis + ", ₹"
                        + split.getShareAmount() + " for this expense).");
            }
        }
    }
}
