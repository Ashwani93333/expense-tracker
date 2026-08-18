package com.expensetracker.classification;

/**
 * Strategy interface for expense category classification. The expense service
 * depends only on this interface, so a future {@code AiCategoryClassifier} (e.g.
 * backed by Gemini) can be plugged in without touching expense creation code.
 */
public interface CategoryClassifier {

    /**
     * Classify an expense from raw information.
     *
     * @param input raw, uninterpreted expense information
     * @return the best classification (may reference a fallback category)
     */
    CategoryClassificationResult classify(CategoryClassificationInput input);
}
