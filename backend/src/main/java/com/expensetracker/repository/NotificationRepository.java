package com.expensetracker.repository;

import com.expensetracker.model.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {

    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);

    List<Notification> findByUserIdAndIsReadFalseOrderByCreatedAtDesc(UUID userId);

    long countByUserIdAndIsReadFalse(UUID userId);

    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true, n.readAt = :readAt " +
           "WHERE n.user.id = :userId AND n.isRead = false")
    void markAllReadForUser(@Param("userId") UUID userId, @Param("readAt") OffsetDateTime readAt);
}
