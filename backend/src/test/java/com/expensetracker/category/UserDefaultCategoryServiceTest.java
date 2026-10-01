package com.expensetracker.category;

import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserDefaultCategory;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserDefaultCategoryRepository;
import com.expensetracker.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserDefaultCategoryServiceTest {

    private final UserDefaultCategoryRepository defaultCategoryRepository = mock(UserDefaultCategoryRepository.class);
    private final CategoryRepository categoryRepository = mock(CategoryRepository.class);
    private final UserRepository userRepository = mock(UserRepository.class);
    private final UserDefaultCategoryService service = new UserDefaultCategoryService(
            defaultCategoryRepository, categoryRepository, userRepository);

    private final UUID userId = UUID.randomUUID();
    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(defaultCategoryRepository.countByUserId(any())).thenReturn(0L);
        when(defaultCategoryRepository.saveAll(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @Test
    void savesTheSelectedCategoriesAsUserDefaults() {
        Category food = category("Food & Dining");
        Category transport = category("Transport");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food, transport));

        int count = service.syncDefaults(userId, List.of(food.getId(), transport.getId()));

        assertThat(count).isEqualTo(2);
        verify(defaultCategoryRepository).deleteByUserId(userId);

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<UserDefaultCategory>> captor = ArgumentCaptor.forClass(List.class);
        verify(defaultCategoryRepository).saveAll(captor.capture());
        assertThat(captor.getValue()).extracting(UserDefaultCategory::getCategory)
                .extracting(Category::getName)
                .containsExactly("Food & Dining", "Transport");
        assertThat(captor.getValue()).allMatch(row -> row.getUser() == user);
    }

    @Test
    void replacesThePreviousSelectionRatherThanAppending() {
        Category food = category("Food & Dining");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food));

        service.syncDefaults(userId, List.of(food.getId()));
        service.syncDefaults(userId, List.of(food.getId()));

        verify(defaultCategoryRepository, org.mockito.Mockito.times(2)).deleteByUserId(userId);
    }

    @Test
    void uncategorizedIsNeverStoredAsADefault() {
        Category uncategorized = category("Uncategorized");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(uncategorized));

        assertThat(service.syncDefaults(userId, List.of(uncategorized.getId()))).isZero();
        verify(defaultCategoryRepository, never()).deleteByUserId(any());
        verify(defaultCategoryRepository, never()).saveAll(any());
    }

    @Test
    void unknownCategoryIdsAreIgnoredRatherThanFailing() {
        Category food = category("Food & Dining");
        when(categoryRepository.findAllById(any())).thenReturn(List.of(food));

        int count = service.syncDefaults(userId, List.of(food.getId(), UUID.randomUUID()));

        assertThat(count).isEqualTo(1);
    }

    @Test
    void emptySelectionLeavesExistingDefaultsUntouched() {
        when(defaultCategoryRepository.countByUserId(userId)).thenReturn(3L);

        assertThat(service.syncDefaults(userId, List.of())).isEqualTo(3);
        verify(defaultCategoryRepository, never()).deleteByUserId(any());
        verify(defaultCategoryRepository, never()).saveAll(any());
    }

    @Test
    void nullSelectionIsTreatedAsNoChange() {
        when(defaultCategoryRepository.countByUserId(userId)).thenReturn(2L);

        assertThat(service.syncDefaults(userId, null)).isEqualTo(2);
        verify(defaultCategoryRepository, never()).saveAll(any());
    }

    @Test
    void defaultIdsReadsTheStoredSelection() {
        Category food = category("Food & Dining");
        when(defaultCategoryRepository.findCategoriesByUserId(userId)).thenReturn(List.of(food));

        assertThat(service.defaultIds(userId)).containsExactly(food.getId());
    }

    private Category category(String name) {
        Category c = new Category();
        c.setId(UUID.randomUUID());
        c.setName(name);
        c.setIsDefault(true);
        return c;
    }
}
