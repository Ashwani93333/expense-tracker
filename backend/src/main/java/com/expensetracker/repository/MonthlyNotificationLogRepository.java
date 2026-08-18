package com.expensetracker.repository;

import com.expensetracker.model.MonthlyNotificationLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MonthlyNotificationLogRepository extends JpaRepository<MonthlyNotificationLog, UUID> {

    Optional<MonthlyNotificationLog> findByUserIdAndMonthAndNotificationType(
            UUID userId, LocalDate month, String notificationType);
}
