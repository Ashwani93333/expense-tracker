package com.expensetracker.model;

/**
 * How a user mainly spends money — personal, shared/group, or both.
 * Captured during onboarding and used to tailor the default experience.
 */
public enum ExpensePreference {
    INDIVIDUAL,
    GROUP,
    BOTH
}