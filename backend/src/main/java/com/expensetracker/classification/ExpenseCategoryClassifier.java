package com.expensetracker.classification;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.model.Category;
import com.expensetracker.repository.CategoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

/**
 * Orchestrates category classification for expenses.
 *
 * <p>Fallback policy (all configurable):
 * <ul>
 *   <li>{@code confidence >= autoAssignThreshold (0.75)} → assign the category automatically</li>
 *   <li>{@code warnThreshold (0.50) <= confidence < 0.75} → assign the best category but flag a warning</li>
 *   <li>{@code confidence < 0.50} → fall back to "Uncategorized"</li>
 * </ul>
 *
 * <p>Why 0.75 / 0.50: a keyword match on a well-known merchant/category is highly
 * reliable (≈0.90+), a name-level match is still fairly safe (≈0.85), while a single
 * weak token (≈0.60) is too ambiguous to silently trust — hence warning. Anything at
 * or below 0.50 carries essentially no evidence, so we never guess and assign
 * "Uncategorized" instead. A future AI classifier simply implements
 * {@link CategoryClassifier} and is injected here.
 */
@Service
public class ExpenseCategoryClassifier {

    private static final Logger log = LoggerFactory.getLogger(ExpenseCategoryClassifier.class);

    private final CategoryClassifier classifier;
    private final CategoryRepository categoryRepository;

    @Value("${app.classification.auto-assign-threshold:0.75}")
    private double autoAssignThreshold;

    @Value("${app.classification.warn-threshold:0.50}")
    private double warnThreshold;

    @Value("${app.classification.fallback-category:Uncategorized}")
    private String fallbackCategoryName;

    public ExpenseCategoryClassifier(CategoryClassifier classifier, CategoryRepository categoryRepository) {
        this.classifier = classifier;
        this.categoryRepository = categoryRepository;
    }

    /**
     * Classifies raw expense information and applies the fallback policy.
     *
     * @return the final, always-assignable classification (never null categoryId)
     */
    public CategoryClassificationResult classify(CategoryClassificationInput input) {
        try {
            CategoryClassificationResult result = classifier.classify(input);
            if (result.getCategoryId() == null) {
                return fallback();
            }
            if (result.getConfidenceScore() >= autoAssignThreshold) {
                return result;
            }
            if (result.getConfidenceScore() >= warnThreshold) {
                // Assign the best guess but surface the warning to the caller.
                return new CategoryClassificationResult(
                        result.getCategoryId(), result.getCategoryName(),
                        result.getConfidenceScore(), result.getSource(), true);
            }
            return fallback();
        } catch (Exception e) {
            log.error("Failed to classify expense category", e);
            return fallback();
        }
    }

    /** Builds a USER-source result for an explicitly supplied categoryId. */
    public CategoryClassificationResult classifyUserChoice(Category category) {
        return new CategoryClassificationResult(
                category.getId(), category.getName(), 1.0, ClassificationSource.USER, false);
    }

    /** Resolves the fallback "Uncategorized" category (created lazily if needed). */
    public CategoryClassificationResult fallback() {
        Category uncategorized = categoryRepository.findByNameIgnoreCase(fallbackCategoryName)
                .orElseGet(() -> {
                    Category c = new Category();
                    c.setName(fallbackCategoryName);
                    c.setIsDefault(true);
                    c.setIcon("❓");
                    c.setColor("#9E9E9E");
                    return categoryRepository.save(c);
                });
        return new CategoryClassificationResult(
                uncategorized.getId(), uncategorized.getName(), 0.0, ClassificationSource.FALLBACK, false);
    }

    public Category requireCategoryById(UUID categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new BadRequestException("Category not found: " + categoryId));
    }
}
