package com.expensetracker.notification;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.User;
import com.expensetracker.model.UserNotificationSettings;
import com.expensetracker.notification.dto.NotificationSettingsDto;
import com.expensetracker.notification.dto.UpdateNotificationSettingsRequest;
import com.expensetracker.repository.UserNotificationSettingsRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Reads and updates a user's notification preferences. Defaults are created
 * lazily on first access and eagerly at signup, so {@code getSettings} always has
 * something to return. Thresholds are de-duplicated and sorted ascending so the
 * stored representation is canonical.
 */
@Service
public class NotificationSettingsService {

    private final UserNotificationSettingsRepository settingsRepository;
    private final UserRepository userRepository;

    public NotificationSettingsService(UserNotificationSettingsRepository settingsRepository,
                                       UserRepository userRepository) {
        this.settingsRepository = settingsRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public NotificationSettingsDto getSettings(UUID userId) {
        return NotificationSettingsDto.fromEntity(getOrCreate(userId));
    }

    @Transactional
    public NotificationSettingsDto updateSettings(UUID userId, UpdateNotificationSettingsRequest req) {
        UserNotificationSettings settings = getOrCreate(userId);

        if (req.getInAppNotifications() != null) {
            settings.setInAppNotifications(req.getInAppNotifications());
        }
        if (req.getEmailNotifications() != null) {
            settings.setEmailNotifications(req.getEmailNotifications());
        }
        if (req.getOverallBudgetEnabled() != null) {
            settings.setOverallBudgetEnabled(req.getOverallBudgetEnabled());
        }
        if (req.getOverallBudgetThresholds() != null) {
            settings.setOverallBudgetThresholds(normalizeThresholds(req.getOverallBudgetThresholds()));
        }
        if (req.getOverallBudgetThresholdType() != null) {
            settings.setOverallBudgetThresholdType(validateThresholdType(req.getOverallBudgetThresholdType()));
        }
        if (req.getCategoryBudgetEnabled() != null) {
            settings.setCategoryBudgetEnabled(req.getCategoryBudgetEnabled());
        }
        if (req.getCategoryBudgetThresholds() != null) {
            settings.setCategoryBudgetThresholds(normalizeThresholds(req.getCategoryBudgetThresholds()));
        }
        if (req.getCategoryBudgetThresholdType() != null) {
            settings.setCategoryBudgetThresholdType(validateThresholdType(req.getCategoryBudgetThresholdType()));
        }
        if (req.getTotalExpenditureEnabled() != null) {
            settings.setTotalExpenditureEnabled(req.getTotalExpenditureEnabled());
        }
        if (req.getTotalExpenditureThresholds() != null) {
            settings.setTotalExpenditureThresholds(normalizeAmountThresholds(req.getTotalExpenditureThresholds()));
        }
        if (req.getTotalExpenditureThresholdType() != null) {
            settings.setTotalExpenditureThresholdType(validateThresholdType(req.getTotalExpenditureThresholdType()));
        }
        if (req.getMonthlySummaryEnabled() != null) {
            settings.setMonthlySummaryEnabled(req.getMonthlySummaryEnabled());
        }
        if (req.getBudgetUpdateEnabled() != null) {
            settings.setBudgetUpdateEnabled(req.getBudgetUpdateEnabled());
        }
        if (req.getExpiryDateUpdateEnabled() != null) {
            settings.setExpiryDateUpdateEnabled(req.getExpiryDateUpdateEnabled());
        }
        if (req.getPaymentApprovalEnabled() != null) {
            settings.setPaymentApprovalEnabled(req.getPaymentApprovalEnabled());
        }

        return NotificationSettingsDto.fromEntity(settingsRepository.save(settings));
    }

    /** Creates defaults for a newly registered user. Safe to call repeatedly. */
    @Transactional
    public void ensureDefaults(UUID userId) {
        getOrCreate(userId);
    }

    private UserNotificationSettings getOrCreate(UUID userId) {
        UserNotificationSettings existing = settingsRepository.findByUserId(userId).orElse(null);
        if (existing != null) {
            return existing;
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        UserNotificationSettings settings = new UserNotificationSettings();
        settings.setUser(user);
        return settingsRepository.save(settings);
    }

    private static List<Integer> normalizeThresholds(List<Integer> thresholds) {
        if (thresholds == null || thresholds.isEmpty()) {
            throw new BadRequestException("At least one threshold is required");
        }
        return thresholds.stream()
                .filter(t -> t != null && t >= 1 && t <= 100)
                .distinct()
                .sorted()
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    /** Total-expenditure thresholds are absolute amounts, so only a positive floor applies. */
    private static List<Integer> normalizeAmountThresholds(List<Integer> thresholds) {
        if (thresholds == null || thresholds.isEmpty()) {
            throw new BadRequestException("At least one threshold is required");
        }
        return thresholds.stream()
                .filter(t -> t != null && t >= 1)
                .distinct()
                .sorted()
                .collect(ArrayList::new, ArrayList::add, ArrayList::addAll);
    }

    private static String validateThresholdType(String type) {
        if (type == null || (!type.equals("PERCENTAGE") && !type.equals("AMOUNT"))) {
            throw new BadRequestException("Threshold type must be PERCENTAGE or AMOUNT");
        }
        return type;
    }
}
