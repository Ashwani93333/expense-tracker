package com.expensetracker.classification;

import com.expensetracker.category.UserCategoryScope;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class RuleBasedCategoryClassifierTest {

    private final UUID userId = UUID.randomUUID();
    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);
    private final UserCategoryScope categoryScope = mock(UserCategoryScope.class);
    private final RuleBasedCategoryClassifier classifier =
            new RuleBasedCategoryClassifier(categoryRepository, categoryScope);

    private Category food;
    private Category customFood;

    @BeforeEach
    void setUp() {
        food = category("Food & Dining", "[\"swiggy\",\"zomato\",\"restaurant\",\"dominos\"]", null);
        customFood = category("My Food", "[\"tiffin\"]", user(userId));
        // The scope is the user's narrowed working set, not the full catalogue.
        when(categoryScope.resolve(userId)).thenReturn(List.of(food, customFood));
    }

    @Test
    void matchesKeywordOnDefaultCategory() {
        CategoryClassificationResult result = classifier.classify(input("Swiggy order"));
        assertThat(result.getCategoryName()).isEqualTo("Food & Dining");
        assertThat(result.getConfidenceScore()).isEqualTo(RuleBasedCategoryClassifier.KEYWORD_MATCH);
        assertThat(result.getSource()).isEqualTo(ClassificationSource.RULE_BASED);
        assertThat(result.isWarning()).isFalse();
    }

    @Test
    void prefersUsersOwnCustomCategoryKeyword() {
        CategoryClassificationResult result = classifier.classify(input("paid tiffin"));
        assertThat(result.getCategoryName()).isEqualTo("My Food");
        assertThat(result.getConfidenceScore()).isEqualTo(RuleBasedCategoryClassifier.USER_CUSTOM_MATCH);
        assertThat(result.getSource()).isEqualTo(ClassificationSource.USER);
    }

    @Test
    void matchesCategoryNameInText() {
        CategoryClassificationResult result = classifier.classify(input("paid for food dining today"));
        assertThat(result.getCategoryName()).isEqualTo("Food & Dining");
        assertThat(result.getConfidenceScore()).isEqualTo(RuleBasedCategoryClassifier.NAME_MATCH);
    }

    @Test
    void shortKeywordsMatchOnWordBoundariesOnly() {
        Category shortKeyword = category("Fitness", "[\"gym\"]", null);
        when(categoryScope.resolve(userId)).thenReturn(List.of(food, customFood, shortKeyword));

        assertThat(classifier.classify(input("visited gym")).getCategoryName()).isEqualTo("Fitness");
        assertThat(classifier.classify(input("went to gymnasium")).getCategoryId()).isNull();
    }

    @Test
    void neverClassifiesIntoADeselectedCategory() {
        Category deselected = category("Entertainment", "[\"cinema\",\"concert\"]", null);
        // Excluded from the working set during onboarding.
        when(categoryScope.resolve(userId)).thenReturn(List.of(food, customFood));

        CategoryClassificationResult result = classifier.classify(input("cinema tickets"));

        assertThat(result.getCategoryId()).isNull();
        assertThat(result.getSource()).isEqualTo(ClassificationSource.FALLBACK);
    }

    @Test
    void blankTextFallsBack() {
        CategoryClassificationResult result = classifier.classify(input("   "));
        assertThat(result.getCategoryId()).isNull();
        assertThat(result.getSource()).isEqualTo(ClassificationSource.FALLBACK);
        assertThat(result.getConfidenceScore()).isZero();
    }

    @Test
    void noMatchFallsBack() {
        when(categoryScope.resolve(userId)).thenReturn(List.of());
        CategoryClassificationResult result = classifier.classify(input("random noise"));
        assertThat(result.getCategoryId()).isNull();
        assertThat(result.getSource()).isEqualTo(ClassificationSource.FALLBACK);
        assertThat(result.getConfidenceScore()).isZero();
    }

    @Test
    void normalizeStripsPunctuationAndLowercases() {
        assertThat(RuleBasedCategoryClassifier.normalize("  Swiggy!  &  Zomato... "))
                .isEqualTo("swiggy zomato");
    }

    private CategoryClassificationInput input(String text) {
        return CategoryClassificationInput.builder()
                .userId(userId)
                .merchant(text)
                .amount(new BigDecimal("250.00"))
                .build();
    }

    private Category category(String name, String keywordsJson, User createdBy) {
        Category c = new Category();
        c.setId(UUID.randomUUID());
        c.setName(name);
        c.setKeywords(keywordsJson);
        c.setCreatedBy(createdBy);
        c.setIsDefault(createdBy == null);
        return c;
    }

    private User user(UUID id) {
        User u = new User();
        u.setId(id);
        return u;
    }
}
