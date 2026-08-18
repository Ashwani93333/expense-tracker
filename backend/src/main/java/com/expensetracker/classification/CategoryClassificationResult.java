package com.expensetracker.classification;

import java.util.UUID;

/**
 * The outcome of {@link CategoryClassifier#classify(CategoryClassificationInput)}.
 * categoryId/categoryName may be null when the classifier could not decide.
 */
public class CategoryClassificationResult {

    private final UUID categoryId;
    private final String categoryName;
    private final double confidenceScore;
    private final ClassificationSource source;
    /** True when confidence was acceptable but below the auto-assign threshold. */
    private final boolean warning;

    public CategoryClassificationResult(UUID categoryId, String categoryName,
                                        double confidenceScore, ClassificationSource source, boolean warning) {
        this.categoryId = categoryId;
        this.categoryName = categoryName;
        this.confidenceScore = confidenceScore;
        this.source = source;
        this.warning = warning;
    }

    public UUID getCategoryId() { return categoryId; }
    public String getCategoryName() { return categoryName; }
    public double getConfidenceScore() { return confidenceScore; }
    public ClassificationSource getSource() { return source; }
    public boolean isWarning() { return warning; }

    @Override
    public String toString() {
        return "CategoryClassificationResult{" +
                "categoryId=" + categoryId +
                ", categoryName='" + categoryName + '\'' +
                ", confidenceScore=" + confidenceScore +
                ", source=" + source +
                ", warning=" + warning +
                '}';
    }
}
