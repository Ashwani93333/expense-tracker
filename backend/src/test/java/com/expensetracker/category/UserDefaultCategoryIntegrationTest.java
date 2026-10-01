package com.expensetracker.category;

import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserDefaultCategory;
import com.expensetracker.preference.UserPreferenceService;
import com.expensetracker.preference.dto.UpdateUserPreferencesRequest;
import com.expensetracker.preference.dto.UserPreferencesDto;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserDefaultCategoryRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.context.ActiveProfiles;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * End-to-end check that picking categories in the preferences form materialises
 * them as the user's default categories, and that the selection then drives what
 * the add-expense picker and the auto-classifier can see.
 */
@SpringBootTest
@ActiveProfiles("h2")
class UserDefaultCategoryIntegrationTest {

    @Autowired
    private UserPreferenceService preferenceService;

    @Autowired
    private UserDefaultCategoryService defaultCategoryService;

    @Autowired
    private UserCategoryScope categoryScope;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private UserDefaultCategoryRepository defaultCategoryRepository;

    /** Keeps the test free of real mail delivery. */
    @MockBean
    private com.expensetracker.mail.EmailService emailService;

    private User user;
    private Category food;
    private Category transport;
    private Category shopping;
    private Category uncategorized;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setFullName("Picky Spender");
        user.setEmail("picky-" + UUID.randomUUID() + "@example.com");
        user.setPasswordHash("hash");
        user.setRole(com.expensetracker.model.Role.ROLE_USER);
        user = userRepository.save(user);

        food = defaultCategory("Food & Dining");
        transport = defaultCategory("Transport");
        shopping = defaultCategory("Shopping");
        uncategorized = defaultCategory("Uncategorized");
    }

    @Test
    void selectedCategoriesArePersistedAsTheUsersDefaultCategories() {
        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setIncomeSlab("FROM_25K_TO_50K");
        req.setExpensePreference("INDIVIDUAL");
        req.setSelectedCategoryIds(List.of(food.getId(), transport.getId()));
        req.setOnboardingCompleted(true);

        preferenceService.updatePreferences(user.getId(), req);

        List<UserDefaultCategory> stored = defaultCategoryRepository.findByUserId(user.getId());
        assertThat(stored).hasSize(2);
        // Compare ids: Category is lazily loaded and this test is not transactional.
        assertThat(stored).extracting(row -> row.getCategory().getId())
                .containsExactlyInAnyOrder(food.getId(), transport.getId());
    }

    @Test
    void defaultsDriveTheAddExpensePickerAndHideEverythingElse() {
        savePreferences(List.of(food.getId(), transport.getId()));

        // Only the selected defaults, plus the always-retained fallback bucket.
        assertThat(categoryScope.resolve(user.getId()))
                .extracting(Category::getName)
                .containsExactlyInAnyOrder("Food & Dining", "Transport", "Uncategorized");
    }

    @Test
    void uncategorizedIsNeverStoredAsADefault() {
        savePreferences(List.of(food.getId(), uncategorized.getId()));

        assertThat(defaultCategoryRepository.findByUserId(user.getId()))
                .extracting(row -> row.getCategory().getId())
                .containsExactly(food.getId());
    }

    @Test
    void changingTheSelectionReplacesTheStoredDefaults() {
        savePreferences(List.of(food.getId(), transport.getId()));
        savePreferences(List.of(shopping.getId()));

        assertThat(defaultCategoryService.defaultIds(user.getId()))
                .containsExactly(shopping.getId());
        assertThat(categoryScope.resolve(user.getId()))
                .extracting(Category::getName)
                .containsExactlyInAnyOrder("Shopping", "Uncategorized");
    }

    @Test
    void aUserWithoutPreferencesStillSeesTheFullCatalogue() {
        assertThat(categoryScope.resolve(user.getId()))
                .extracting(Category::getName)
                .contains("Food & Dining", "Transport", "Shopping", "Uncategorized");
    }

    private void savePreferences(List<UUID> categoryIds) {
        UpdateUserPreferencesRequest req = new UpdateUserPreferencesRequest();
        req.setIncomeSlab("FROM_25K_TO_50K");
        req.setExpensePreference("INDIVIDUAL");
        req.setSelectedCategoryIds(categoryIds);
        req.setOnboardingCompleted(true);
        UserPreferencesDto ignored = preferenceService.updatePreferences(user.getId(), req);
    }

    private Category defaultCategory(String name) {
        Category existing = categoryRepository.findByNameIgnoreCase(name).orElse(null);
        if (existing != null) return existing;
        Category category = new Category();
        category.setName(name);
        category.setIsDefault(true);
        return categoryRepository.save(category);
    }
}
