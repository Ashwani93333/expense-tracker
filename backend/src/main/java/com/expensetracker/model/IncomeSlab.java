package com.expensetracker.model;

import java.math.BigDecimal;

/**
 * Monthly income range buckets captured during onboarding. Each slab carries a
 * suggested overall monthly spending budget (a sensible default users can
 * override later in budget settings).
 */
public enum IncomeSlab {
    UNDER_25K("Under ₹25K", 12500),
    FROM_25K_TO_50K("₹25K – ₹50K", 20000),
    FROM_50K_TO_1L("₹50K – ₹1L", 35000),
    FROM_1L_TO_2P5L("₹1L – ₹2.5L", 60000),
    ABOVE_2P5L("Above ₹2.5L", 120000);

    private final String label;
    private final BigDecimal suggestedMonthlyBudget;

    IncomeSlab(String label, int suggestedMonthlyBudget) {
        this.label = label;
        this.suggestedMonthlyBudget = BigDecimal.valueOf(suggestedMonthlyBudget);
    }

    public String getLabel() {
        return label;
    }

    public BigDecimal getSuggestedMonthlyBudget() {
        return suggestedMonthlyBudget;
    }
}