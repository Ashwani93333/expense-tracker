package com.expensetracker.preference;

import com.expensetracker.model.Category;
import com.expensetracker.model.IncomeSlab;
import com.expensetracker.model.User;
import com.expensetracker.model.UserBudget;
import com.expensetracker.model.UserPreferences;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserBudgetRepository;
import com.expensetracker.repository.UserPreferencesRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

/**
 * Turns the onboarding preferences into real, persisted state.
 *
 * <p>Right now the income slab, spending style and category picks were recorded
 * and then never used. This applies them:
 * <ul>
 *   <li>the income slab's suggested figure becomes the user's overall monthly budget</li>
 *   <li>the selected categories are split a share of that budget as category caps</li>
 * </ul>
 *
 * <p>Every write is <strong>create-if-absent</strong>. The UNIQUE(user_id,
 * category_id, month) constraint plus an existence check means re-saving
 * preferences, re-running onboarding or editing a budget later never clobbers a
 * figure the user set by hand. Pass {@code force = true} to deliberately overwrite.
 */
@Component
public class PreferenceSetupService {

    private static final Logger log = LoggerFactory.getLogger(PreferenceSetupService.class);

    /**
     * Share of the overall budget each default category typically consumes. These
     * sum to 1.0 and are only ever applied across the categories the user actually
     * selected, renormalised so the caps always add up to the overall budget.
     */
    private static final Map<String, Double> CATEGORY_SHARE = new LinkedHashMap<>();

    static {
        // Keys are normalised (lowercase) to match normaliseName() below.
        CATEGORY_SHARE.put("food & dining", 0.30);
        CATEGORY_SHARE.put("groceries", 0.20);
        CATEGORY_SHARE.put("transport", 0.12);
        CATEGORY_SHARE.put("bills & utilities", 0.18);
        CATEGORY_SHARE.put("entertainment", 0.07);
        CATEGORY_SHARE.put("shopping", 0.08);
        CATEGORY_SHARE.put("health & fitness", 0.05);
    }

    private final UserPreferencesRepository preferencesRepository;
    private final UserBudgetRepository userBudgetRepository;
    private final CategoryRepository categoryRepository;

    public PreferenceSetupService(UserPreferencesRepository preferencesRepository,
                                  UserBudgetRepository userBudgetRepository,
                                  CategoryRepository categoryRepository) {
        this.preferencesRepository = preferencesRepository;
        this.userBudgetRepository = userBudgetRepository;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Applies the current preferences: overall budget from the income slab, then
     * per-category caps from the selected categories. Never overwrites an existing
     * budget.
     *
     * @return the number of budget rows created
     */
    @Transactional
    public int applyPreferences(UUID userId) {
        UserPreferences prefs = preferencesRepository.findByUserId(userId).orElse(null);
        if (prefs == null || prefs.getIncomeSlab() == null) {
            return 0;
        }
        return applyPreferences(userId, prefs, false);
    }

    @Transactional
    public int applyPreferences(UUID userId, UserPreferences prefs, boolean force) {
        User user = prefs.getUser();
        LocalDate month = LocalDate.now().withDayOfMonth(1);
        int created = 0;

        BigDecimal overall = suggestedOverallBudget(prefs);
        if (overall != null && overall.signum() > 0) {
            created += upsertOverall(user, month, overall, force) ? 1 : 0;
        }

        List<Category> selected = selectedBudgetableCategories(prefs);
        if (!selected.isEmpty() && overall != null && overall.signum() > 0) {
            created += applyCategoryCaps(user, month, selected, overall, force);
        }

        if (created > 0) {
            log.info("Applied {} budget row(s) from onboarding preferences for user {}", created, userId);
        }
        return created;
    }

    /** The slab's suggested monthly budget, or null when unset/invalid. */
    public BigDecimal suggestedOverallBudget(UserPreferences prefs) {
        if (prefs.getIncomeSlab() == null) return null;
        try {
            return IncomeSlab.valueOf(prefs.getIncomeSlab()).getSuggestedMonthlyBudget();
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private boolean upsertOverall(User user, LocalDate month, BigDecimal limit, boolean force) {
        var existing = userBudgetRepository.findByUserIdAndCategoryIdIsNullAndMonth(user.getId(), month);
        if (existing.isPresent()) {
            if (!force) return false;
            UserBudget budget = existing.get();
            budget.setBudgetLimit(limit);
            userBudgetRepository.save(budget);
            return true;
        }
        UserBudget budget = new UserBudget();
        budget.setUser(user);
        budget.setCategory(null);
        budget.setMonth(month);
        budget.setBudgetLimit(limit);
        userBudgetRepository.save(budget);
        return true;
    }

    /**
     * Splits the overall budget across the selected categories using each one's
     * typical share, renormalised over the selection. The last category absorbs the
     * rounding remainder so the caps sum exactly to the overall figure.
     */
    private int applyCategoryCaps(User user, LocalDate month, List<Category> selected,
                                  BigDecimal overall, boolean force) {
        Map<Category, Double> shares = new LinkedHashMap<>();
        double totalShare = 0.0;
        for (Category c : selected) {
            double share = CATEGORY_SHARE.getOrDefault(normaliseName(c.getName()), 0.0);
            // Uncategorized (and any unrecognised category) gets no cap.
            if (share <= 0) continue;
            shares.put(c, share);
            totalShare += share;
        }
        if (totalShare <= 0) return 0;

        List<Category> ordered = new ArrayList<>(shares.keySet());
        int created = 0;
        BigDecimal allocated = BigDecimal.ZERO;

        for (int i = 0; i < ordered.size(); i++) {
            Category category = ordered.get(i);
            boolean isLast = i == ordered.size() - 1;
            BigDecimal cap = isLast
                    ? overall.subtract(allocated)
                    : overall.multiply(BigDecimal.valueOf(shares.get(category) / totalShare))
                            .setScale(2, RoundingMode.HALF_UP);
            allocated = allocated.add(cap);

            if (cap.signum() <= 0) continue;
            if (upsertCategory(user, month, category, cap, force)) created++;
        }
        return created;
    }

    private boolean upsertCategory(User user, LocalDate month, Category category,
                                   BigDecimal limit, boolean force) {
        var existing = userBudgetRepository
                .findByUserIdAndCategoryIdAndMonth(user.getId(), category.getId(), month);
        if (existing.isPresent()) {
            if (!force) return false;
            UserBudget budget = existing.get();
            budget.setBudgetLimit(limit);
            userBudgetRepository.save(budget);
            return true;
        }
        UserBudget budget = new UserBudget();
        budget.setUser(user);
        budget.setCategory(category);
        budget.setMonth(month);
        budget.setBudgetLimit(limit);
        userBudgetRepository.save(budget);
        return true;
    }

    /**
     * The user's selected categories that are worth capping: still present in the
     * catalogue and not the Uncategorized fallback (which receives no budget).
     */
    private List<Category> selectedBudgetableCategories(UserPreferences prefs) {
        List<UUID> selectedIds = prefs.getSelectedCategoryIds();
        if (selectedIds == null || selectedIds.isEmpty()) return List.of();

        return categoryRepository.findAllById(new LinkedHashSet<>(selectedIds)).stream()
                .filter(c -> !"Uncategorized".equalsIgnoreCase(c.getName()))
                .sorted(Comparator.comparing(Category::getName, String.CASE_INSENSITIVE_ORDER))
                .toList();
    }

    private static String normaliseName(String name) {
        return name == null ? "" : name.trim().toLowerCase(Locale.ROOT);
    }
}