package com.expensetracker.classification;

public enum ClassificationSource {
    /** Deterministic keyword/rule based matching. */
    RULE_BASED,
    /** Reserved for a future AI-based classifier (Gemini etc.). */
    AI,
    /** Category was explicitly chosen by the user. */
    USER,
    /** Low-confidence fallback (e.g. "Uncategorized"). */
    FALLBACK
}
