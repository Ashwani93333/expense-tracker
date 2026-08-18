package com.expensetracker.budget;

import com.expensetracker.model.BudgetNotificationEvent;
import com.expensetracker.model.User;
import com.expensetracker.repository.BudgetNotificationEventRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

/**
 * Inserts budget-notification ledger rows in their own transaction. Kept as a
 * separate bean (rather than a method on the evaluator) so that the
 * REQUIRES_NEW boundary is honored through the Spring proxy — a unique-constraint
 * violation poisons only this transaction and is caught by the caller, never the
 * surrounding evaluation loop.
 */
@Component
public class BudgetNotificationEventRecorder {

    private final BudgetNotificationEventRepository eventRepository;

    public BudgetNotificationEventRecorder(BudgetNotificationEventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }

    public boolean exists(String dedupKey) {
        return eventRepository.existsByDedupKey(dedupKey);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(User user, String dedupKey, UUID budgetId, UUID categoryId, UUID groupId,
                       LocalDate month, int threshold, String notificationType) {
        BudgetNotificationEvent event = new BudgetNotificationEvent();
        event.setUser(user);
        event.setDedupKey(dedupKey);
        event.setBudgetId(budgetId);
        event.setCategoryId(categoryId);
        event.setGroupId(groupId);
        event.setMonth(month);
        event.setThreshold(threshold);
        event.setNotificationType(notificationType);
        // flush forces the unique constraint to be checked inside this transaction
        eventRepository.saveAndFlush(event);
    }
}
