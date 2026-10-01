package com.expensetracker.preference;

import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.model.UserPreferences;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserBudgetRepository;
import com.expensetracker.repository.UserPreferencesRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class PreferenceSetupServiceTest {

    private final UserPreferencesRepository preferencesRepository = mock(UserPreferencesRepository.class);
    private final UserBudgetRepository userBudgetRepository = mock(UserBudgetRepository.class);
    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);
    private final PreferenceSetupService service = new PreferenceSetupService(
            preferencesRepository, userBudgetRepository, categoryRepository);

    private final UUID userId = UUID.randomUUID();
    private final LocalDate thisMonth = LocalDate.now().withDayOfMonth(1);

    private User user;
    private UserPreferences prefs;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(userId);

        when(userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(any(), any()))
                .thenReturn(Optional.empty());
        when(userBudgetRepository.findByUserIdAndCategoryIdAndMonth(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(userBudgetRepository.save(any(UserBudget.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(categoryRepository.findAllById(any())).thenReturn(List.of());
    }

    @Test
    void createsOverallBudgetFromTheIncomeSlab() {
        Category food = category("Food & Dining");
        Category transport = category("Transport");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food, transport));
        prefs = preferences("FROM_25K_TO_50K", List.of(food, transport));

        int created = service.applyPreferences(userId, prefs, false);

        // 1 overall + 2 category caps (shares renormalised over the selection).
        assertThat(created).isEqualTo(3);
        ArgumentCaptor<UserBudget> captor = ArgumentCaptor.forClass(UserBudget.class);
        verify(userBudgetRepository, times(3)).save(captor.capture());
        assertThat(captor.getAllValues())
                .anyMatch(b -> b.getCategory() == null
                        && b.getBudgetLimit().compareTo(new BigDecimal("20000.00")) == 0
                        && b.getMonth().equals(thisMonth));
    }

    @Test
    void categoryCapsSumExactlyToTheOverallBudget() {
        Category food = category("Food & Dining");
        Category bills = category("Bills & Utilities");
        Category groceries = category("Groceries");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food, bills, groceries));
        prefs = preferences("UNDER_25K", List.of(food, bills, groceries));

        service.applyPreferences(userId, prefs, false);

        ArgumentCaptor<UserBudget> captor = ArgumentCaptor.forClass(UserBudget.class);
        verify(userBudgetRepository, times(4)).save(captor.capture());
        BigDecimal capSum = captor.getAllValues().stream()
                .filter(b -> b.getCategory() != null)
                .map(UserBudget::getBudgetLimit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(capSum).isEqualByComparingTo(new BigDecimal("12500.00"));
    }

    @Test
    void neverOverwritesAnExistingOverallBudget() {
        UserBudget existing = new UserBudget();
        existing.setUser(user);
        existing.setBudgetLimit(new BigDecimal("999.00"));
        when(userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(any(), any()))
                .thenReturn(Optional.of(existing));

        prefs = preferences("ABOVE_2P5L", List.of());

        int created = service.applyPreferences(userId, prefs, false);

        assertThat(created).isZero();
        assertThat(existing.getBudgetLimit()).isEqualByComparingTo("999.00");
        verify(userBudgetRepository, never()).save(any(UserBudget.class));
    }

    @Test
    void forceOverwritesTheOverallBudget() {
        UserBudget existing = new UserBudget();
        existing.setUser(user);
        existing.setBudgetLimit(new BigDecimal("999.00"));
        when(userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(any(), any()))
                .thenReturn(Optional.of(existing));

        prefs = preferences("ABOVE_2P5L", List.of());

        assertThat(service.applyPreferences(userId, prefs, true)).isEqualTo(1);
        assertThat(existing.getBudgetLimit()).isEqualByComparingTo("120000.00");
    }

    @Test
    void uncategorizedGetsNoBudgetCap() {
        Category uncategorized = category("Uncategorized");
        Category food = category("Food & Dining");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(uncategorized, food));
        prefs = preferences("FROM_50K_TO_1L", List.of(uncategorized, food));

        service.applyPreferences(userId, prefs, false);

        ArgumentCaptor<UserBudget> captor = ArgumentCaptor.forClass(UserBudget.class);
        verify(userBudgetRepository, times(2)).save(captor.capture());
        assertThat(captor.getAllValues()).allMatch(b -> b.getCategory() == null || b.getCategory() != uncategorized);
    }

    @Test
    void doesNothingWithoutAnIncomeSlab() {
        prefs = preferences(null, List.of());

        assertThat(service.applyPreferences(userId, prefs, false)).isZero();
        verify(userBudgetRepository, never()).save(any(UserBudget.class));
    }

    @Test
    void unknownIncomeSlabIsIgnoredRatherThanThrowing() {
        prefs = preferences("SOMETHING_ELSE", List.of());

        assertThat(service.applyPreferences(userId, prefs, false)).isZero();
        verify(userBudgetRepository, never()).save(any(UserBudget.class));
    }

    @Test
    void loadOverloadReadsPreferencesAndAppliesThem() {
        Category food = category("Food & Dining");
        prefs = preferences("UNDER_25K", List.of(food));
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food));
        when(preferencesRepository.findByUserId(userId)).thenReturn(Optional.of(prefs));

        assertThat(service.applyPreferences(userId)).isEqualTo(2);
    }

    private UserPreferences preferences(String incomeSlab, List<Category> selected) {
        UserPreferences p = new UserPreferences();
        p.setUser(user);
        p.setIncomeSlab(incomeSlab);
        p.setExpensePreference("INDIVIDUAL");
        p.setSelectedCategoryIds(selected.stream().map(Category::getId).toList());
        return p;
    }

    private Category category(String name) {
        Category c = new Category();
        c.setId(UUID.randomUUID());
        c.setName(name);
        c.setIsDefault(true);
        return c;
    }
}
