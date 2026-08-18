package com.expensetracker.expense;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Published by {@link ExpenseService} after an expense is created. Listened to
 * AFTER_COMMIT so budget evaluation happens once the expense is durably committed.
 */
public class ExpenseCreatedEvent {

    private final UUID userId;
    private final UUID groupId;
    private final LocalDate expenseDate;

    public ExpenseCreatedEvent(UUID userId, UUID groupId, LocalDate expenseDate) {
        this.userId = userId;
        this.groupId = groupId;
        this.expenseDate = expenseDate;
    }

    public UUID getUserId() { return userId; }
    public UUID getGroupId() { return groupId; }
    public LocalDate getExpenseDate() { return expenseDate; }
}
