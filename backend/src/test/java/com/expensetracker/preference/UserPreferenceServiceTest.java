package com.expensetracker.preference;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserPreferences;
import com.expensetracker.preference.dto.UpdateUserPreferencesRequest;
import com.expensetracker.preference.dto.UserPreferencesDto;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserPreferencesRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserPreferenceServiceTest {

    private final UUID userId = UUID.randomUUID();
    private final UserPreferencesRepository preferencesRepository =
            mock(UserPreferencesRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);
    private final UserPreferenceService service =
            new UserPreferenceService(preferencesRepository, userRepository, categoryRepository);

    @BeforeEach
    void setUp() {
        when(preferencesRepository.save(any(UserPreferences.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(userRepository.save(any(User.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
    }

    @Test
    void getPreferencesCreatesDefaultsOnFirstAccess() {
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        UserPreferencesDto dto = service.getPreferences(userId);

        assertThat(dto.getIncomeSlab()).isNull();
        assertThat(dto.getExpensePreference()).isNull();
        assertThat(dto.getSelectedCategoryIds()).isEmpty();
        assertThat(dto.getOnboardingCompleted()).isFalse();
        verify(preferencesRepository).save(any(UserPreferences.class));
    }

    @Test
    void getPreferencesReturnsExistingWithoutCreating() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user());
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        service.getPreferences(userId);
    }

    @Test
    void updatePreferencesCompletesOnboardingWhenEssentialsFilled() {
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        User user = user();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setIncomeSlab("FROM_50K_TO_1L");
        req.setExpensePreference("BOTH");

        UserPreferencesDto dto = service.updatePreferences(userId, req);

        assertThat(dto.getIncomeSlab()).isEqualTo("FROM_50K_TO_1L");
        assertThat(dto.getIncomeSlabLabel()).isEqualTo("₹50K – ₹1L");
        assertThat(dto.getSuggestedMonthlyBudget()).isEqualByComparingTo("35000");
        assertThat(dto.getExpensePreference()).isEqualTo("BOTH");
        assertThat(dto.getOnboardingCompleted()).isTrue();
        assertThat(user.getOnboardingCompleted()).isTrue();
        verify(userRepository).save(user);
    }

    @Test
    void updatePreferencesKeepsExistingRowAndStoresValidatedCategories() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user());
        existing.setIncomeSlab("UNDER_25K");
        existing.setExpensePreference("INDIVIDUAL");
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.of(existing));
        User user = user();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Category cat = new Category();
        cat.setId(UUID.randomUUID());
        when(categoryRepository.findDefaultsAndUserCategories(userId))
                .thenReturn(List.of(cat));

        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setSelectedCategoryIds(List.of(cat.getId(), UUID.randomUUID()));

        UserPreferencesDto dto = service.updatePreferences(userId, req);

        assertThat(dto.getIncomeSlab()).isEqualTo("UNDER_25K");
        assertThat(dto.getSelectedCategoryIds()).containsExactly(cat.getId());
        verify(preferencesRepository).save(existing);
    }

    @Test
    void explicitOnboardingFlagCompletesOnboarding() {
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        User user = user();
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setOnboardingCompleted(true);

        UserPreferencesDto dto = service.updatePreferences(userId, req);

        assertThat(dto.getOnboardingCompleted()).isTrue();
    }

    @Test
    void updatePreferencesRejectsUnknownSlab() {
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setIncomeSlab("NOT_A_SLAB");

        assertThatThrownBy(() -> service.updatePreferences(userId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("incomeSlab");
    }

    @Test
    void updatePreferencesRejectsUnknownExpensePreference() {
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user()));

        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setExpensePreference("MAYBE");

        assertThatThrownBy(() -> service.updatePreferences(userId, req))
                .isInstanceOf(BadRequestException.class)
                .hasMessageContaining("expensePreference");
    }

    private User user() {
        User u = new User();
        u.setId(userId);
        u.setOnboardingCompleted(false);
        return u;
    }
}