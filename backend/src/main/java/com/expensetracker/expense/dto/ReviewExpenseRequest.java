package com.expensetracker.expense.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Admin decision on a member's group payment.
 * action: APPROVE | REJECT (note is mandatory for REJECT).
 */
public class ReviewExpenseRequest {

    @NotBlank(message = "action is required")
    private String action;

    @Size(max = 500, message = "note must be at most 500 characters")
    private String note;

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }
}
