package com.expensetracker.notification;

import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Notification;
import com.expensetracker.model.User;
import com.expensetracker.notification.dto.NotificationDto;
import com.expensetracker.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final InAppNotificationService inAppNotificationService;
    private final EmailNotificationService emailNotificationService;

    public NotificationService(NotificationRepository notificationRepository,
                               InAppNotificationService inAppNotificationService,
                               EmailNotificationService emailNotificationService) {
        this.notificationRepository = notificationRepository;
        this.inAppNotificationService = inAppNotificationService;
        this.emailNotificationService = emailNotificationService;
    }

    @Transactional
    public void createNotification(User user, String type, String title, String message,
                                   UUID referenceId, String referenceType) {
        inAppNotificationService.createNotification(user, type, title, message, referenceId, referenceType);
    }

    /**
     * Dispatches a budget alert through the channels the user has enabled:
     * in-app and/or email. Runs in its own transaction (REQUIRES_NEW) because it
     * is typically invoked from an AFTER_COMMIT event listener, where Spring still
     * reports the already-committed outer transaction as active — joining it would
     * silently discard the in-app notification when that transaction is torn down.
     * Never throws for email failures (logged and swallowed) so that notification
     * problems can never break expense creation or idempotency bookkeeping.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatchBudgetAlert(User user, boolean inAppEnabled, boolean emailEnabled,
                                    String type, String title, String message,
                                    UUID referenceId, String referenceType,
                                    EmailNotificationService.BudgetAlertEmail emailData) {
        if (inAppEnabled) {
            inAppNotificationService.createNotification(user, type, title, message, referenceId, referenceType);
        }
        if (emailEnabled) {
            emailNotificationService.sendBudgetAlertEmail(user, type, emailData);
        }
    }

    /**
     * Dispatches a notification through in-app and/or email channels based on user settings.
     * Used for budget updates, expiry date updates, and payment approve/reject notifications.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void dispatchNotification(User user, boolean inAppEnabled, boolean emailEnabled,
                                     String type, String title, String message,
                                     UUID referenceId, String referenceType) {
        if (inAppEnabled) {
            inAppNotificationService.createNotification(user, type, title, message, referenceId, referenceType);
        }
        if (emailEnabled) {
            emailNotificationService.sendGenericNotificationEmail(user, type, title, message);
        }
    }

    @Transactional(readOnly = true)
    public List<NotificationDto> getNotificationsForUser(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(NotificationDto::fromEntity).collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationDto markAsRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!n.getUser().getId().equals(userId)) {
            throw new com.expensetracker.exception.AccessDeniedException("Not your notification");
        }
        n.setIsRead(true);
        n.setReadAt(OffsetDateTime.now());
        return NotificationDto.fromEntity(notificationRepository.save(n));
    }

    @Transactional
    public void markAllRead(UUID userId) {
        notificationRepository.markAllReadForUser(userId, OffsetDateTime.now());
    }
}
