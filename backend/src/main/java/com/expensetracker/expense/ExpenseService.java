package com.expensetracker.expense;

import com.expensetracker.classification.CategoryClassificationInput;
import com.expensetracker.classification.CategoryClassificationResult;
import com.expensetracker.classification.ClassificationSource;
import com.expensetracker.classification.ExpenseCategoryClassifier;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.expense.dto.ExpenseDto;
import com.expensetracker.expense.dto.SplitRequest;
import com.expensetracker.expense.dto.UpdateExpenseRequest;
import com.expensetracker.group.GroupRoleGuard;
import com.expensetracker.model.*;
import com.expensetracker.notification.NotificationService;
import com.expensetracker.repository.*;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ExpenseService {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_APPROVED = "APPROVED";
    public static final String STATUS_REJECTED = "REJECTED";

    private final ExpenseRepository expenseRepository;
    private final ExpenseGroupRepository groupRepository;
    private final GroupMemberRepository groupMemberRepository;
    private final UserRepository userRepository;
    private final ExpenseSplitService splitService;
    private final ExpenseSplitRepository splitRepository;
    private final ExpenseCategoryClassifier categoryClassifier;
    private final ApplicationEventPublisher eventPublisher;
    private final GroupRoleGuard groupRoleGuard;
    private final NotificationService notificationService;

    public ExpenseService(
            ExpenseRepository expenseRepository,
            ExpenseGroupRepository groupRepository,
            GroupMemberRepository groupMemberRepository,
            UserRepository userRepository,
            ExpenseSplitService splitService,
            ExpenseSplitRepository splitRepository,
            ExpenseCategoryClassifier categoryClassifier,
            ApplicationEventPublisher eventPublisher,
            GroupRoleGuard groupRoleGuard,
            NotificationService notificationService) {
        this.expenseRepository = expenseRepository;
        this.groupRepository = groupRepository;
        this.groupMemberRepository = groupMemberRepository;
        this.userRepository = userRepository;
        this.splitService = splitService;
        this.splitRepository = splitRepository;
        this.categoryClassifier = categoryClassifier;
        this.eventPublisher = eventPublisher;
        this.groupRoleGuard = groupRoleGuard;
        this.notificationService = notificationService;
    }

    @Transactional
    public ExpenseDto createExpense(User currentUser, CreateExpenseRequest req) {
        Expense expense = new Expense();
        expense.setUser(currentUser);
        expense.setAmount(req.getAmount());
        expense.setDescription(req.getDescription());
        expense.setExpenseDate(req.getExpenseDate());
        expense.setReceiptUrl(req.getReceiptUrl());
        expense.setReceiptHash(req.getReceiptHash());

        // ── Duplicate receipt check ─────────────────────────────────────────
        if (req.getReceiptHash() != null && !req.getReceiptHash().isBlank()) {
            boolean alreadyExists = expenseRepository.existsByUserIdAndReceiptHash(
                    currentUser.getId(), req.getReceiptHash());
            if (alreadyExists) {
                throw new BadRequestException(
                    "This receipt has already been uploaded. A duplicate expense was not created.");
            }
        }

        applyCategoryClassification(expense, currentUser, req);

        if (req.getGroupId() != null) {
            ExpenseGroup group = groupRepository.findById(req.getGroupId())
                    .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + req.getGroupId()));
            if (group.getExpiresAt() != null && group.getExpiresAt().isBefore(java.time.OffsetDateTime.now())) {
                throw new BadRequestException("This group has expired and no longer accepts expenses");
            }
            boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(
                    group.getId(), currentUser.getId(), "ACTIVE");
            if (!isMember) {
                throw new AccessDeniedException("You are not a member of this group");
            }
            expense.setGroup(group);
            expense.setSplitType(req.getSplitType());

            // Set paidBy
            if (req.getPaidBy() != null) {
                User paidBy = userRepository.findById(req.getPaidBy())
                        .orElseThrow(() -> new ResourceNotFoundException("Paid-by user not found"));
                expense.setPaidBy(paidBy);
            } else {
                expense.setPaidBy(currentUser);
            }

            // Admin payments are trusted and take effect immediately; member
            // payments stay PENDING until a group admin validates them.
            if (groupRoleGuard.isAdmin(group.getId(), currentUser.getId())) {
                expense.setStatus(STATUS_APPROVED);
                expense.setReviewedBy(currentUser);
                expense.setReviewedAt(OffsetDateTime.now());
            } else {
                expense.setStatus(STATUS_PENDING);
            }
        }

        Expense saved = expenseRepository.save(expense);

        List<ExpenseSplit> splits = null;
        if (req.getGroupId() != null && req.getSplits() != null && !req.getSplits().isEmpty()) {
            splits = splitService.createSplits(saved, req.getSplits(), req.getSplitType());
        }

        // Budget threshold evaluation happens asynchronously after commit.
        eventPublisher.publishEvent(new ExpenseCreatedEvent(
                currentUser.getId(), req.getGroupId(), saved.getExpenseDate()));

        return ExpenseDto.fromEntity(saved, splits);
    }

    /**
     * Decides the category for a new expense: an explicit categoryId wins (USER
     * source); otherwise the rule-based classifier runs and applies the configured
     * fallback policy. The result and its confidence are stored on the expense.
     */
    private void applyCategoryClassification(Expense expense, User currentUser, CreateExpenseRequest req) {
        if (req.getCategoryId() != null) {
            Category category = categoryClassifier.requireCategoryById(req.getCategoryId());
            expense.setCategory(category);
            expense.setCategorySource(ClassificationSource.USER.name());
            expense.setCategoryConfidence(1.0);
            return;
        }
        CategoryClassificationInput input = CategoryClassificationInput.builder()
                .userId(currentUser.getId())
                .merchant(null)
                .description(req.getDescription())
                .rawText(null)
                .amount(req.getAmount())
                .build();
        CategoryClassificationResult result = categoryClassifier.classify(input);
        if (result.getCategoryId() != null) {
            expense.setCategory(categoryClassifier.requireCategoryById(result.getCategoryId()));
        }
        expense.setCategorySource(result.getSource().name());
        expense.setCategoryConfidence(result.getConfidenceScore());
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getPersonalExpenses(User user, String month) {
        LocalDate[] range = parseMonthRange(month);
        return expenseRepository.findByUserIdAndGroupIsNullAndExpenseDateBetweenOrderByExpenseDateDesc(
                        user.getId(), range[0], range[1])
                .stream()
                .map(e -> ExpenseDto.fromEntity(e, splitRepository.findByExpenseId(e.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public ExpenseDto getExpenseById(User user, UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (!expense.getUser().getId().equals(user.getId())) {
            // Allow if member of the group
            if (expense.getGroup() == null ||
                    !groupMemberRepository.existsByGroupIdAndUserIdAndStatus(expense.getGroup().getId(), user.getId(), "ACTIVE")) {
                throw new AccessDeniedException("You do not have access to this expense");
            }
        }
        List<ExpenseSplit> splits = splitRepository.findByExpenseId(expenseId);
        return ExpenseDto.fromEntity(expense, splits);
    }

    @Transactional
    public ExpenseDto updateExpense(User user, UUID expenseId, UpdateExpenseRequest req) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (!expense.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only edit your own expenses");
        }
        if (req.getAmount() != null) expense.setAmount(req.getAmount());
        if (req.getDescription() != null) expense.setDescription(req.getDescription());
        if (req.getExpenseDate() != null) expense.setExpenseDate(req.getExpenseDate());
        if (req.getReceiptUrl() != null) expense.setReceiptUrl(req.getReceiptUrl());
        if (req.getCategoryId() != null) {
            Category cat = categoryClassifier.requireCategoryById(req.getCategoryId());
            expense.setCategory(cat);
            expense.setCategorySource(ClassificationSource.USER.name());
            expense.setCategoryConfidence(1.0);
        }
        // An edited group payment must be re-validated by an admin unless the
        // editor is an admin themselves — otherwise approval could be bypassed.
        if (expense.getGroup() != null && STATUS_APPROVED.equals(expense.getStatus())
                && !groupRoleGuard.isAdmin(expense.getGroup().getId(), user.getId())) {
            resetToPending(expense);
        }
        Expense saved = expenseRepository.save(expense);
        return ExpenseDto.fromEntity(saved, splitRepository.findByExpenseId(saved.getId()));
    }

    private void resetToPending(Expense expense) {
        expense.setStatus(STATUS_PENDING);
        expense.setReviewedBy(null);
        expense.setReviewedAt(null);
        expense.setReviewNote(null);
    }

    @Transactional
    public void deleteExpense(User user, UUID expenseId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (!expense.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You can only delete your own expenses");
        }
        expenseRepository.delete(expense);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getMonthlySummary(User user, String month) {
        LocalDate[] range = parseMonthRange(month);
        BigDecimal total = expenseRepository.sumPersonalExpensesForMonth(user.getId(), range[0], range[1]);
        List<Object[]> breakdown = expenseRepository.categoryBreakdownPersonal(user.getId(), range[0], range[1]);

        List<Map<String, Object>> categoryList = breakdown.stream()
                .map(row -> Map.<String, Object>of(
                        "categoryId", row[0] != null ? row[0].toString() : "uncategorized",
                        "categoryName", row[1] != null ? row[1].toString() : "Uncategorized",
                        "total", row[2]
                ))
                .collect(Collectors.toList());

        return Map.of(
                "month", month,
                "totalSpent", total,
                "categoryBreakdown", categoryList
        );
    }

    @Transactional(readOnly = true)
    public List<ExpenseDto> getGroupExpenses(User user, UUID groupId, String month, String status) {
        boolean isMember = groupMemberRepository.existsByGroupIdAndUserIdAndStatus(groupId, user.getId(), "ACTIVE");
        if (!isMember) throw new AccessDeniedException("You are not a member of this group");

        LocalDate[] range = parseMonthRange(month);
        List<Expense> expenses = (status == null || status.isBlank())
                ? expenseRepository.findByGroupIdAndExpenseDateBetweenOrderByExpenseDateDesc(groupId, range[0], range[1])
                : expenseRepository.findByGroupIdAndStatusAndExpenseDateBetweenOrderByExpenseDateDesc(
                        groupId, status.toUpperCase(), range[0], range[1]);
        return expenses.stream()
                .map(e -> ExpenseDto.fromEntity(e, splitRepository.findByExpenseId(e.getId())))
                .collect(Collectors.toList());
    }

    /**
     * Group admin validation of a member's payment. Only ACTIVE group admins can
     * decide, only PENDING expenses are reviewable, and a rejection must carry a
     * note so the owner knows why. The owner is notified of every decision.
     */
    @Transactional
    public ExpenseDto reviewExpense(User reviewer, UUID expenseId, String action, String note) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (expense.getGroup() == null) {
            throw new BadRequestException("Personal expenses do not require admin approval");
        }
        UUID groupId = expense.getGroup().getId();
        groupRoleGuard.requireAdmin(groupId, reviewer.getId());

        if (!STATUS_PENDING.equals(expense.getStatus())) {
            throw new BadRequestException("This expense has already been reviewed");
        }
        String decision = action == null ? "" : action.trim().toUpperCase();
        if (!"APPROVE".equals(decision) && !"REJECT".equals(decision)) {
            throw new BadRequestException("action must be APPROVE or REJECT");
        }
        boolean approved = "APPROVE".equals(decision);
        if (!approved && (note == null || note.isBlank())) {
            throw new BadRequestException("A reason is required when rejecting an expense");
        }

        expense.setStatus(approved ? STATUS_APPROVED : STATUS_REJECTED);
        expense.setReviewedBy(reviewer);
        expense.setReviewedAt(OffsetDateTime.now());
        expense.setReviewNote(approved ? null : note.trim());

        if (!approved) {
            // On rejection: convert to personal expense.
            // Remove from group, delete splits, mark as APPROVED so it
            // appears in the user's personal expense list (they did spend it).
            expense.setGroup(null);
            expense.setSplitType(null);
            expense.setPaidBy(null);
            expense.setStatus(STATUS_APPROVED);

            // Delete all splits — the expense is no longer shared
            splitRepository.deleteByExpenseId(expense.getId());
        }

        Expense saved = expenseRepository.save(expense);

        User owner = saved.getUser();
        String amount = "₹" + saved.getAmount() + " for \"" + saved.getDescription() + "\"";
        if (approved) {
            notificationService.createNotification(
                    owner,
                    "EXPENSE_APPROVED",
                    "Payment approved",
                    reviewer.getFullName() + " approved your payment of " + amount + ".",
                    saved.getId(),
                    "EXPENSE");
            // Budget thresholds were skipped while the payment was pending.
            eventPublisher.publishEvent(new ExpenseCreatedEvent(
                    owner.getId(), groupId, saved.getExpenseDate()));
        } else {
            notificationService.createNotification(
                    owner,
                    "EXPENSE_REJECTED",
                    "Payment rejected — moved to personal expenses",
                    reviewer.getFullName() + " rejected your group payment of " + amount + ". Reason: " + note.trim()
                            + " The expense has been moved to your personal expenses.",
                    saved.getId(),
                    "EXPENSE");
        }
        return ExpenseDto.fromEntity(saved, splitRepository.findByExpenseId(saved.getId()));
    }

    @Transactional
    public ExpenseDto createGroupExpense(User user, UUID groupId, CreateExpenseRequest req) {
        req.setGroupId(groupId);
        return createExpense(user, req);
    }

    @Transactional
    public ExpenseDto updateSplits(User user, UUID expenseId, List<SplitRequest> splits) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        if (!expense.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("Only the expense owner can edit splits");
        }
        if (expense.getGroup() == null) throw new BadRequestException("This is not a group expense");
        List<ExpenseSplit> updatedSplits = splitService.updateSplits(expense, splits, expense.getSplitType());
        return ExpenseDto.fromEntity(expense, updatedSplits);
    }

    @Transactional
    public ExpenseDto settleShare(User user, UUID expenseId, UUID targetUserId) {
        Expense expense = expenseRepository.findById(expenseId)
                .orElseThrow(() -> new ResourceNotFoundException("Expense not found: " + expenseId));
        // Allow settling own share or admin
        if (!user.getId().equals(targetUserId)) {
            if (expense.getGroup() == null) throw new AccessDeniedException("Not authorized");
            boolean isAdmin = groupMemberRepository.findByGroupIdAndUserId(expense.getGroup().getId(), user.getId())
                    .map(gm -> "ADMIN".equals(gm.getRole()) && "ACTIVE".equals(gm.getStatus()))
                    .orElse(false);
            if (!isAdmin) throw new AccessDeniedException("Only group admins can settle other members' shares");
        }
        splitService.settleShare(expenseId, targetUserId);
        List<ExpenseSplit> splits = splitRepository.findByExpenseId(expenseId);
        return ExpenseDto.fromEntity(expense, splits);
    }

    // ---- helpers ----
    public static LocalDate[] parseMonthRange(String month) {
        if (month == null || month.isBlank()) {
            LocalDate now = LocalDate.now();
            return new LocalDate[]{now.withDayOfMonth(1), now.withDayOfMonth(now.lengthOfMonth())};
        }
        // Expected format: YYYY-MM
        String[] parts = month.split("-");
        if (parts.length != 2) {
            throw new BadRequestException("month parameter must be in YYYY-MM format");
        }
        int year = Integer.parseInt(parts[0]);
        int mon = Integer.parseInt(parts[1]);
        LocalDate first = LocalDate.of(year, mon, 1);
        return new LocalDate[]{first, first.withDayOfMonth(first.lengthOfMonth())};
    }
}
