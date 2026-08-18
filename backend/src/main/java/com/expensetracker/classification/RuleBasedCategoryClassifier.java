package com.expensetracker.classification;

import com.expensetracker.category.CategoryKeywords;
import com.expensetracker.model.Category;
import com.expensetracker.repository.CategoryRepository;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Deterministic, rule-based category classifier.
 *
 * <p>Scoring:
 * <ul>
 *   <li>0.97 — keyword match on the user's own custom category (preferred)</li>
 *   <li>0.90 — keyword match on a system default category</li>
 *   <li>0.85 — category name matched in the text</li>
 *   <li>0.60 — single shared token (weak)</li>
 *   <li>0.00 — no match (the orchestrator then applies the fallback policy)</li>
 * </ul>
 *
 * <p>Short keywords (fewer than 4 chars, e.g. "gym", "bus") are matched on word
 * boundaries to avoid false positives like "business". All matching is done on
 * lower-cased, punctuation-normalised text so it stays deterministic.
 */
@Component
public class RuleBasedCategoryClassifier implements CategoryClassifier {

    static final double USER_CUSTOM_MATCH = 0.97;
    static final double KEYWORD_MATCH = 0.90;
    static final double NAME_MATCH = 0.85;
    static final double WEAK_MATCH = 0.60;

    private final CategoryRepository categoryRepository;

    public RuleBasedCategoryClassifier(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public CategoryClassificationResult classify(CategoryClassificationInput input) {
        String text = normalize(input.combinedText());
        if (text.isBlank()) {
            return new CategoryClassificationResult(null, null, 0.0, ClassificationSource.FALLBACK, false);
        }

        List<Category> candidates = categoryRepository.findDefaultsAndUserCategories(input.getUserId());

        Category best = null;
        double bestScore = 0.0;
        for (Category candidate : candidates) {
            double score = scoreCategory(candidate, text);
            if (score > bestScore) {
                bestScore = score;
                best = candidate;
            }
        }

        if (best == null || bestScore <= 0.0) {
            return new CategoryClassificationResult(null, null, 0.0, ClassificationSource.FALLBACK, false);
        }

        boolean userCustom = best.getCreatedBy() != null && best.getCreatedBy().getId().equals(input.getUserId());
        ClassificationSource source = userCustom ? ClassificationSource.USER : ClassificationSource.RULE_BASED;
        return new CategoryClassificationResult(best.getId(), best.getName(), bestScore, source, false);
    }

    /** Scores a single category against the normalised text. */
    double scoreCategory(Category category, String normalizedText) {
        String name = normalize(category.getName());
        if (!name.isBlank() && normalizedText.contains(name)) {
            return NAME_MATCH;
        }

        List<String> keywords = CategoryKeywords.parse(category.getKeywords());
        for (String rawKeyword : keywords) {
            String keyword = normalize(rawKeyword);
            if (keyword.isBlank()) continue;
            if (matchKeyword(keyword, normalizedText)) {
                boolean userCustom = category.getCreatedBy() != null;
                return userCustom ? USER_CUSTOM_MATCH : KEYWORD_MATCH;
            }
        }

        // Weak single-token overlap
        if (hasWeakTokenOverlap(keywords, normalizedText)) {
            return WEAK_MATCH;
        }
        return 0.0;
    }

    private boolean matchKeyword(String keyword, String normalizedText) {
        if (keyword.length() < 4) {
            // Word-boundary match for short keywords
            return Pattern.compile("(?<![a-z0-9])" + Pattern.quote(keyword) + "(?![a-z0-9])")
                    .matcher(normalizedText).find();
        }
        return normalizedText.contains(keyword);
    }

    private boolean hasWeakTokenOverlap(List<String> keywords, String normalizedText) {
        for (String keyword : keywords) {
            String k = normalize(keyword);
            if (k.length() >= 3 && k.length() < 4) {
                if (matchKeyword(k, normalizedText)) return true;
            }
        }
        // also weak match on longer keywords whose first token appears
        for (String token : normalizedText.split("\\s+")) {
            if (token.length() >= 3 && keywords.stream().anyMatch(k -> k.equalsIgnoreCase(token))) {
                return true;
            }
        }
        return false;
    }

    static String normalize(String value) {
        if (value == null) return "";
        return value.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", " ")
                .trim()
                .replaceAll("\\s+", " ");
    }
}
