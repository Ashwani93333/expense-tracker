package com.expensetracker.budget;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.ExpenseSplit;
import com.expensetracker.model.GroupMemberBudget;
import com.expensetracker.repository.ExpenseSplitRepository;
import com.expensetracker.repository.GroupMemberBudgetRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

/**
 * Hard-enforces per-member group budget caps. A member can never have more of
 * their share counted toward an approved expense than the cap an admin assigned
 * them for that month. Members without a cap for the month are not restricted.
 *
 * <p>The check is projection-based: it takes the spend already on the books
 * (excluding the expense currently being created/edited), adds the new share,
 * and rejects the write if the result exceeds the cap. This keeps enforcement
 * identical whether an admin is creating an already-approved expense, an admin
 * is approving a pending member expense, or split amounts are being edited.
 */
@Service
public class MemberBudgetCapEnforcer {

    private final GroupMemberBudgetRepository memberBudgetRepository;
    private final ExpenseSplitRepository splitRepository;

    public MemberBudgetCapEnforcer(GroupMemberBudgetRepository memberBudgetRepository,
                                   ExpenseSplitRepository splitRepository) {
        this.memberBudgetRepository = memberBudgetRepository;
        this.splitRepository = splitRepository;
    }

    /**
     * Throws {@link BadRequestException} if the given splits would push any
     * participant past their monthly cap. {@code excludeExpenseId} must be the id
     * of the expense being written so its own splits are not double-counted.
     */
    public void enforceCaps(UUID groupId, LocalDate expenseDate, UUID excludeExpenseId,
                            List<ExpenseSplit> splits) {
        enforce(groupId, expenseDate, excludeExpenseId, splits, false);
    }

    /**
     * Creation-time variant: pending shares count too, so a member cannot stack
     * multiple pending expenses that together exceed the cap while waiting for review.
     */
    public void enforceCapsAtCreation(UUID groupId, LocalDate expenseDate, UUID excludeExpenseId,
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
            GroupMemberBudget capRow = memberBudgetRepository
                    .findByGroupIdAndUserIdAndMonth(groupId, split.getUser().getId(), start)
                    .orElse(null);
            if (capRow == null || split.getShareAmount() == null) {
                continue;
            }
            BigDecimal cap = capRow.getBudgetLimit();
            BigDecimal spent = includePending
                    ? splitRepository.sumMemberShareInGroupForMonthExcludingCommitted(
                            split.getUser().getId(), groupId, excludeExpenseId, start, end)
                    : splitRepository.sumMemberShareInGroupForMonthExcluding(
                            split.getUser().getId(), groupId, excludeExpenseId, start, end);
            BigDecimal projected = spent.add(split.getShareAmount());
            if (projected.compareTo(cap) > 0) {
                String basis = includePending ? "already spent or pending" : "already spent";
                throw new BadRequestException(
                        split.getUser().getFullName() + " would exceed their monthly cap of ₹"
                        + cap + " in this group (₹" + spent + " " + basis + ", ₹"
                        + split.getShareAmount() + " for this expense).");
            }
        }
    }
}