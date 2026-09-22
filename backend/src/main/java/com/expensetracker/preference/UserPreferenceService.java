package com.expensetracker.preference;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Category;
import com.expensetracker.model.ExpensePreference;
import com.expensetracker.model.IncomeSlab;
import com.expensetracker.model.User;
import com.expensetracker.model.UserPreferences;
import com.expensetracker.preference.dto.UpdateUserPreferencesRequest;
import com.expensetracker.preference.dto.UserPreferencesDto;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserPreferencesRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class UserPreferenceService {

    private final UserPreferencesRepository preferencesRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public UserPreferenceService(UserPreferencesRepository preferencesRepository,
                                 UserRepository userRepository,
                                 CategoryRepository categoryRepository) {
        this.preferencesRepository = preferencesRepository;
        this.userRepository = userRepository;
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public UserPreferencesDto getPreferences(UUID userId) {
        User user = requireUser(userId);
        return UserPreferencesDto.fromEntity(getOrCreate(userId, user), user);
    }

    @Transactional
    public UserPreferencesDto updatePreferences(UUID userId, UpdateUserPreferencesRequest req) {
        User user = requireUser(userId);
        UserPreferences prefs = getOrCreate(userId, user);

        if (req.getIncomeSlab() != null) {
            prefs.setIncomeSlab(validSlab(req.getIncomeSlab()));
        }
        if (req.getExpensePreference() != null) {
            prefs.setExpensePreference(validExpensePreference(req.getExpensePreference()));
        }
        if (req.getSelectedCategoryIds() != null) {
            prefs.setSelectedCategoryIds(validCategoryIds(userId, req.getSelectedCategoryIds()));
        }
        preferencesRepository.save(prefs);

        boolean explicitlyCompleted = Boolean.TRUE.equals(req.getOnboardingCompleted());
        boolean essentialsFilled = prefs.getIncomeSlab() != null && prefs.getExpensePreference() != null;
        if (!Boolean.TRUE.equals(user.getOnboardingCompleted()) && (explicitlyCompleted || essentialsFilled)) {
            user.setOnboardingCompleted(true);
            userRepository.save(user);
        }

        return UserPreferencesDto.fromEntity(prefs, user);
    }

    private UserPreferences getOrCreate(UUID userId, User user) {
        return preferencesRepository.findByUserId(userId)
                .orElseGet(() -> {
                    UserPreferences prefs = new UserPreferences();
                    prefs.setUser(user);
                    return preferencesRepository.save(prefs);
                });
    }

    private User requireUser(UUID userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
    }

    private String validSlab(String incomeSlab) {
        try {
            return IncomeSlab.valueOf(incomeSlab).name();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("incomeSlab must be one of: "
                    + java.util.Arrays.stream(IncomeSlab.values()).map(Enum::name).collect(Collectors.joining(", ")));
        }
    }

    private String validExpensePreference(String expensePreference) {
        try {
            return ExpensePreference.valueOf(expensePreference).name();
        } catch (IllegalArgumentException e) {
            throw new BadRequestException("expensePreference must be one of: "
                    + java.util.Arrays.stream(ExpensePreference.values()).map(Enum::name).collect(Collectors.joining(", ")));
        }
    }

    private List<UUID> validCategoryIds(UUID userId, List<UUID> categoryIds) {
        Set<UUID> uniqueIds = categoryIds.stream()
                .filter(java.util.Objects::nonNull)
                .collect(Collectors.toCollection(LinkedHashSet::new));
        if (uniqueIds.isEmpty()) {
            return List.of();
        }
        List<Category> accessible = categoryRepository.findDefaultsAndUserCategories(userId);
        Set<UUID> accessibleIds = accessible.stream().map(Category::getId).collect(Collectors.toSet());
        uniqueIds.removeIf(id -> !accessibleIds.contains(id));
        if (uniqueIds.isEmpty() && !categoryIds.isEmpty()) {
            throw new BadRequestException("Selected categories are not valid");
        }
        return List.copyOf(uniqueIds);
    }
}