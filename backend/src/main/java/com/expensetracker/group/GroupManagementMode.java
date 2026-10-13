package com.expensetracker.group;

/**
 * How a group's spending is managed.
 *
 * <ul>
 *   <li>{@link #INCOME} — spending is bounded by each member's recorded income;
 *       budget features are unavailable.</li>
 *   <li>{@link #BUDGET} — the classic budgeting flow with group and per-member
 *       caps; income tracking is unavailable.</li>
 * </ul>
 */
public enum GroupManagementMode {
    INCOME,
    BUDGET
}
