package com.expensetracker.repository;

import com.expensetracker.model.UserNotificationSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserNotificationSettingsRepository extends JpaRepository<UserNotificationSettings, UUID> {

    Optional<UserNotificationSettings> findByUserId(UUID userId);

    List<UserNotificationSettings> findByMonthlySummaryEnabledTrue();
}
