package com.expensetracker.notification;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.User;
import com.expensetracker.model.UserNotificationSettings;
import com.expensetracker.notification.dto.NotificationSettingsDto;
import com.expensetracker.notification.dto.UpdateNotificationSettingsRequest;
import com.expensetracker.repository.UserNotificationSettingsRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Arrays;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class NotificationSettingsServiceTest {

    private final UUID userId = UUID.randomUUID();
    private final UserNotificationSettingsRepository settingsRepository =
            mock(UserNotificationSettingsRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final NotificationSettingsService service =
            new NotificationSettingsService(settingsRepository, userRepository);

    @BeforeEach
    void setUp() {
        when(settingsRepository.save(any(UserNotificationSettings.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void getSettingsCreatesDefaultsOnFirstAccess() {
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        NotificationSettingsDto dto = service.getSettings(userId);

        assertThat(dto.getUserId()).isEqualTo(userId);
        assertThat(dto.getInAppNotifications()).isTrue();
        assertThat(dto.getEmailNotifications()).isTrue();
        assertThat(dto.getOverallBudgetEnabled()).isTrue();
        assertThat(dto.getOverallBudgetThresholds()).containsExactly(80, 100);
        assertThat(dto.getCategoryBudgetThresholds()).containsExactly(80, 100);
        assertThat(dto.getTotalExpenditureEnabled()).isFalse();
        assertThat(dto.getMonthlySummaryEnabled()).isFalse();
        assertThat(dto.getBudgetUpdateEnabled()).isTrue();
        assertThat(dto.getExpiryDateUpdateEnabled()).isTrue();
        assertThat(dto.getPaymentApprovalEnabled()).isTrue();
        verify(settingsRepository).save(any(UserNotificationSettings.class));
    }

    @Test
    void getSettingsReturnsExistingWithoutCreating() {
        UserNotificationSettings existing = new UserNotificationSettings();
        existing.setUser(user());
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(existing));

        service.getSettings(userId);

        verify(settingsRepository, never()).save(any(UserNotificationSettings.class));
        verify(userRepository, never()).findById(any());
    }

    @Test
    void updateSettingsNormalizesThresholds() {
        UserNotificationSettings existing = new UserNotificationSettings();
        existing.setUser(user());
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(existing));

        UpdateNotificationSettingsRequest req = new UpdateNotificationSettingsRequest();
        req.setInAppNotifications(false);
        req.setOverallBudgetThresholds(Arrays.asList(100, 50, 50, 200, 0));
        req.setTotalExpenditureEnabled(true);
        req.setTotalExpenditureThresholds(Arrays.asList(10000, 2500));

        NotificationSettingsDto dto = service.updateSettings(userId, req);

        assertThat(dto.getInAppNotifications()).isFalse();
        assertThat(dto.getOverallBudgetThresholds()).containsExactly(50, 100);
        assertThat(dto.getTotalExpenditureThresholds()).containsExactly(2500, 10000);
        assertThat(dto.getTotalExpenditureEnabled()).isTrue();
        assertThat(dto.getEmailNotifications()).isTrue();
    }

    @Test
    void updateSettingsHandlesGroupNotificationToggles() {
        UserNotificationSettings existing = new UserNotificationSettings();
        existing.setUser(user());
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(existing));

        UpdateNotificationSettingsRequest req = new UpdateNotificationSettingsRequest();
        req.setBudgetUpdateEnabled(false);
        req.setExpiryDateUpdateEnabled(false);
        req.setPaymentApprovalEnabled(true);

        NotificationSettingsDto dto = service.updateSettings(userId, req);

        assertThat(dto.getBudgetUpdateEnabled()).isFalse();
        assertThat(dto.getExpiryDateUpdateEnabled()).isFalse();
        assertThat(dto.getPaymentApprovalEnabled()).isTrue();
    }

    @Test
    void updateSettingsRejectsEmptyThresholdList() {
        UserNotificationSettings existing = new UserNotificationSettings();
        existing.setUser(user());
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.of(existing));

        UpdateNotificationSettingsRequest req = new UpdateNotificationSettingsRequest();
        req.setOverallBudgetThresholds(List.of());

        assertThatThrownBy(() -> service.updateSettings(userId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("At least one threshold is required");
    }

    @Test
    void ensureDefaultsCreatesSettings() {
        when(settingsRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        service.ensureDefaults(userId);

        verify(settingsRepository).save(any(UserNotificationSettings.class));
    }

    private User user() {
        User u = new User();
        u.setId(userId);
        return u;
    }
}
