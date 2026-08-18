package com.expensetracker.budget;

import com.expensetracker.expense.ExpenseCreatedEvent;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.User;
import com.expensetracker.repository.ExpenseGroupRepository;
import com.expensetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Reacts to {@link ExpenseCreatedEvent} AFTER the expense transaction commits and
 * runs budget threshold evaluation in its own transaction. Because it runs
 * post-commit, budget alert failures can never affect the already-committed
 * expense. fallbackExecution keeps it working for callers without an active
 * transaction (e.g. tests).
 */
@Component
public class BudgetEvaluationListener {

    private static final Logger log = LoggerFactory.getLogger(BudgetEvaluationListener.class);

    private final BudgetThresholdEvaluator evaluator;
    private final UserRepository userRepository;
    private final ExpenseGroupRepository groupRepository;

    public BudgetEvaluationListener(BudgetThresholdEvaluator evaluator,
                                    UserRepository userRepository,
                                    ExpenseGroupRepository groupRepository) {
        this.evaluator = evaluator;
        this.userRepository = userRepository;
        this.groupRepository = groupRepository;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT, fallbackExecution = true)
    public void onExpenseCreated(ExpenseCreatedEvent event) {
        try {
            User user = userRepository.findById(event.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException("User not found: " + event.getUserId()));
            evaluator.evaluatePersonalBudget(user, event.getExpenseDate());

            if (event.getGroupId() != null) {
                ExpenseGroup group = groupRepository.findById(event.getGroupId())
                        .orElseThrow(() -> new ResourceNotFoundException("Group not found: " + event.getGroupId()));
                evaluator.evaluateGroupBudget(group, event.getExpenseDate());
            }
        } catch (Exception e) {
            // Never let budget evaluation failures surface to the expense caller.
            log.error("Budget threshold evaluation failed after expense creation", e);
        }
    }
}
