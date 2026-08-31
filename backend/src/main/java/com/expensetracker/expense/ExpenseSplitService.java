package com.expensetracker.expense;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.expense.dto.SplitRequest;
import com.expensetracker.model.*;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.repository.ExpenseSplitRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ExpenseSplitService {

    private final ExpenseSplitRepository splitRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    public ExpenseSplitService(
            ExpenseSplitRepository splitRepository,
            UserRepository userRepository,
            @Lazy NotificationService notificationService) {
        this.splitRepository = splitRepository;
        this.userRepository = userRepository;
        this.notificationService = notificationService;
    }

    /**
     * Validates and persists splits for a group expense.
     * Must be called within an existing transaction.
     */
    @Transactional
    public List<ExpenseSplit> createSplits(Expense expense, List<SplitRequest> splitRequests, String splitType) {
        if (splitRequests == null || splitRequests.isEmpty()) {
            throw new BadRequestException("Splits are required for group expenses");
        }

        validateSplits(expense.getAmount(), splitRequests, splitType);

        List<ExpenseSplit> splits = new ArrayList<>();
        for (SplitRequest req : splitRequests) {
            User member = userRepository.findById(req.getUserId())
                    .orElseThrow(() -> new BadRequestException("User not found for split: " + req.getUserId()));

            ExpenseSplit split = new ExpenseSplit();
            split.setExpense(expense);
            split.setUser(member);
            split.setShareAmount(req.getShareAmount());
            split.setSharePercent(req.getSharePercent());
            split.setIsSettled(false);
            splits.add(splitRepository.save(split));

            // Notify each member they've been assigned a split
            if (!member.getId().equals(expense.getUser().getId())) {
                notificationService.createNotification(
                        member,
                        "EXPENSE_SPLIT_ASSIGNED",
                        "New expense split assigned",
                        expense.getUser().getFullName() + " logged an expense of ₹" +
                                req.getShareAmount() + " that includes you.",
                        expense.getId(),
                        "EXPENSE"
                );
            }
        }
        return splits;
    }

    /**
     * Replaces all splits for an existing expense.
     */
    @Transactional
    public List<ExpenseSplit> updateSplits(Expense expense, List<SplitRequest> splitRequests, String splitType) {
        splitRepository.deleteByExpenseId(expense.getId());
        return createSplits(expense, splitRequests, splitType);
    }

    @Transactional(readOnly = true)
    public List<ExpenseSplit> getSplitsForExpense(UUID expenseId) {
        return splitRepository.findByExpenseId(expenseId);
    }

    @Transactional
    public ExpenseSplit settleShare(UUID expenseId, UUID userId) {
        ExpenseSplit split = splitRepository.findByExpenseIdAndUserId(expenseId, userId)
                .orElseThrow(() -> new BadRequestException("Split not found for user " + userId + " on expense " + expenseId));
        split.setIsSettled(true);
        split.setSettledAt(java.time.OffsetDateTime.now());
        return splitRepository.save(split);
    }

    private void validateSplits(BigDecimal totalAmount, List<SplitRequest> splits, String splitType) {
        for (SplitRequest s : splits) {
            if (s.getShareAmount() == null) {
                throw new BadRequestException("Split share amount cannot be null for user " + s.getUserId());
            }
        }
        BigDecimal sum = splits.stream()
                .map(SplitRequest::getShareAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
                .setScale(2, RoundingMode.HALF_UP);

        BigDecimal expected = totalAmount.setScale(2, RoundingMode.HALF_UP);

        if (sum.compareTo(expected) != 0) {
            throw new BadRequestException(
                    "Split amounts sum (" + sum + ") must equal the expense total (" + expected + ")");
        }

        if ("PERCENT".equals(splitType)) {
            BigDecimal pctSum = splits.stream()
                    .filter(s -> s.getSharePercent() != null)
                    .map(SplitRequest::getSharePercent)
                    .reduce(BigDecimal.ZERO, BigDecimal::add)
                    .setScale(2, RoundingMode.HALF_UP);
            if (pctSum.compareTo(new BigDecimal("100.00")) != 0) {
                throw new BadRequestException("Percentages must sum to 100 (got " + pctSum + ")");
            }
        }
    }
}
