package com.expensetracker.classification;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Raw, uninterpreted information about an expense that is passed to a
 * {@link CategoryClassifier}. Contains no category decision — deciding the
 * category is the classifier's job.
 */
public class CategoryClassificationInput {

    /** Owner of the expense; used to prefer user-specific custom categories. */
    private final UUID userId;

    private final String merchant;
    private final String description;
    private final String rawText;
    private final BigDecimal amount;
    /** Optional category hint (e.g. from OCR). Ignored unless it maps cleanly. */
    private final UUID categoryHint;

    public CategoryClassificationInput(UUID userId, String merchant, String description,
                                       String rawText, BigDecimal amount, UUID categoryHint) {
        this.userId = userId;
        this.merchant = merchant;
        this.description = description;
        this.rawText = rawText;
        this.amount = amount;
        this.categoryHint = categoryHint;
    }

    public static Builder builder() {
        return new Builder();
    }

    public UUID getUserId() { return userId; }
    public String getMerchant() { return merchant; }
    public String getDescription() { return description; }
    public String getRawText() { return rawText; }
    public BigDecimal getAmount() { return amount; }
    public UUID getCategoryHint() { return categoryHint; }

    public String combinedText() {
        StringBuilder sb = new StringBuilder();
        append(sb, merchant);
        append(sb, description);
        append(sb, rawText);
        return sb.toString();
    }

    private void append(StringBuilder sb, String part) {
        if (part != null && !part.isBlank()) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(part);
        }
    }

    public static class Builder {
        private UUID userId;
        private String merchant;
        private String description;
        private String rawText;
        private BigDecimal amount;
        private UUID categoryHint;

        public Builder userId(UUID userId) { this.userId = userId; return this; }
        public Builder merchant(String merchant) { this.merchant = merchant; return this; }
        public Builder description(String description) { this.description = description; return this; }
        public Builder rawText(String rawText) { this.rawText = rawText; return this; }
        public Builder amount(BigDecimal amount) { this.amount = amount; return this; }
        public Builder categoryHint(UUID categoryHint) { this.categoryHint = categoryHint; return this; }

        public CategoryClassificationInput build() {
            return new CategoryClassificationInput(userId, merchant, description, rawText, amount, categoryHint);
        }
    }
}
