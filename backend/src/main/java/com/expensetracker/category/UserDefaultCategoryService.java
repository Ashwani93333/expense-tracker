package com.expensetracker.category;

import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.model.UserDefaultCategory;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserDefaultCategoryRepository;
import com.expensetracker.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Materialises the categories chosen in the preferences form as the user's
 * default categories.
 *
 * <p>Each save replaces the previous set, so ticking and unticking in the form is
 * immediately reflected everywhere: the category manager, the add-expense picker
 * and the auto-classifier all read from this table.
 */
@Service
public class UserDefaultCategoryService {

    private static final Logger log = LoggerFactory.getLogger(UserDefaultCategoryService.class);

    private final UserDefaultCategoryRepository defaultCategoryRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public UserDefaultCategoryService(UserDefaultCategoryRepository defaultCategoryRepository,
                                      CategoryRepository categoryRepository,
                                      UserRepository userRepository) {
        this.defaultCategoryRepository = defaultCategoryRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    /**
     * Replaces the user's default categories with {@code categoryIds}.
     *
     * <p>An empty selection is treated as "no opinion yet" and leaves the existing
     * defaults alone rather than wiping the user's working set.
     *
     * @return the number of defaults now stored
     */
    @Transactional
    public int syncDefaults(UUID userId, List<UUID> categoryIds) {
        Set<UUID> requested = new LinkedHashSet<>(categoryIds == null ? List.of() : categoryIds);
        requested.remove(null);
        // An empty selection is treated as "no opinion yet": it leaves the existing
        // defaults alone rather than wiping the user's working set.
        if (requested.isEmpty()) {
            return (int) defaultCategoryRepository.countByUserId(userId);
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        // Ignore ids that no longer exist rather than failing the whole save, and
        // drop the classifier's fallback bucket — it is never a "default".
        List<Category> categories = categoryRepository.findAllById(requested).stream()
                .filter(c -> !UserCategoryScope.FALLBACK_CATEGORY.equalsIgnoreCase(c.getName()))
                .toList();
        if (categories.isEmpty()) {
            return 0;
        }

        defaultCategoryRepository.deleteByUserId(userId);
        List<UserDefaultCategory> rows = categories.stream()
                .map(category -> UserDefaultCategory.of(user, category))
                .collect(Collectors.toList());
        defaultCategoryRepository.saveAll(rows);

        log.info("Synced {} default categor(y/ies) for user {}", rows.size(), userId);
        return rows.size();
    }

    /** The user's default category ids, as stored in the database. */
    @Transactional(readOnly = true)
    public Set<UUID> defaultIds(UUID userId) {
        return defaultCategoryRepository.findCategoriesByUserId(userId).stream()
                .map(Category::getId)
                .collect(Collectors.toCollection(LinkedHashSet::new));
    }
}
