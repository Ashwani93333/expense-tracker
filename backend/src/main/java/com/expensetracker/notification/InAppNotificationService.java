package com.expensetracker.notification;

import com.expensetracker.model.Notification;
import com.expensetracker.model.User;
import com.expensetracker.repository.NotificationRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Creates in-app notifications. This is a thin, self-contained service so that
 * notification dispatch can be reused from the budget evaluator, the group invite
 * flow and the monthly summary job without tangling them into NotificationService.
 */
@Service
public class InAppNotificationService {

    private final NotificationRepository notificationRepository;

    public InAppNotificationService(NotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    @Transactional
    public void createNotification(User user, String type, String title, String message,
                                   UUID referenceId, String referenceType) {
        Notification notification = new Notification();
        notification.setUser(user);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setReferenceId(referenceId);
        notification.setReferenceType(referenceType);
        notification.setIsRead(false);
        notificationRepository.save(notification);
    }
}
