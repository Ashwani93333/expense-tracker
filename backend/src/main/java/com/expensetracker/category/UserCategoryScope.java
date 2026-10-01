package com.expensetracker.category;

import com.expensetracker.model.Category;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserPreferencesRepository;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Resolves the set of categories a user should actually see and classify into.
 *
 * <p>Onboarding captures the categories a user cares about. Those become their
 * working set: the rest of the seeded defaults are hidden from pickers, filters
 * and the auto-classifier so the app matches what they told us.
 *
 * <p>Two categories are always retained regardless of the selection:
 * <ul>
 *   <li>categories already attached to one of the user's expenses, so historical
 *       rows never lose their label or drop out of a breakdown</li>
 *   <li>the user's own custom categories, which they created deliberately</li>
 * </ul>
 *
 * <p>Before onboarding finishes — or when nothing was selected — this resolves to
 * the full catalogue, so a fresh account is never left with an empty app.
 */
@Component
public class UserCategoryScope {

    /** The classifier's fallback bucket — always kept in the working set. */
    static final String FALLBACK_CATEGORY = "Uncategorized";

    private final CategoryRepository categoryRepository;
    private final UserPreferencesRepository userPreferencesRepository;
    private final UserDefaultCategoryService defaultCategoryService;

    public UserCategoryScope(CategoryRepository categoryRepository,
                             UserPreferencesRepository userPreferencesRepository,
                             UserDefaultCategoryService defaultCategoryService) {
        this.categoryRepository = categoryRepository;
        this.userPreferencesRepository = userPreferencesRepository;
        this.defaultCategoryService = defaultCategoryService;
    }

    /** Full catalogue: every default category plus the user's own custom ones. */
    @Transactional(readOnly = true)
    public List<Category> accessible(UUID userId) {
        return categoryRepository.findDefaultsAndUserCategories(userId);
    }

    /** The narrowed working set. Falls back to {@link #accessible} when unset. */
    @Transactional(readOnly = true)
    public List<Category> resolve(UUID userId) {
        List<Category> accessible = accessible(userId);
        Set<UUID> preferred = preferredIds(userId);

        if (preferred.isEmpty()) {
            return accessible;
        }

        Set<UUID> used = new LinkedHashSet<>();
        categoryRepository.findCategoriesUsedByUser(userId)
                .forEach(c -> used.add(c.getId()));

        return accessible.stream()
                .filter(c -> {
                    // Custom categories are always the user's own.
                    if (!Boolean.TRUE.equals(c.getIsDefault())) return true;
                    // Keep anything already used by an existing expense.
                    if (used.contains(c.getId())) return true;
                    // The classifier's fallback bucket always stays addressable.
                    if (FALLBACK_CATEGORY.equalsIgnoreCase(c.getName())) return true;
                    return preferred.contains(c.getId());
                })
                .toList();
    }

    /**
     * Ids of the user's default categories.
     *
     * <p>Read from {@code user_default_categories}, which the preferences form
     * writes. Accounts that onboarded before that table existed fall back to the
     * raw {@code selected_category_ids} payload on their preferences row.
     */
    @Transactional(readOnly = true)
    public Set<UUID> preferredIds(UUID userId) {
        Set<UUID> stored = defaultCategoryService.defaultIds(userId);
        if (!stored.isEmpty()) {
            return stored;
        }
        return userPreferencesRepository.findByUserId(userId)
                .map(prefs -> (Set<UUID>) new LinkedHashSet<UUID>(prefs.getSelectedCategoryIds()))
                .filter(ids -> !ids.isEmpty())
                .orElseGet(Set::of);
    }
}