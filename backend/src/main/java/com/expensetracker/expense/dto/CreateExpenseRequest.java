package com.expensetracker.expense.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public class CreateExpenseRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    @NotNull(message = "Expense date is required")
    private LocalDate expenseDate;

    private UUID categoryId;

    /** Set only for group expenses */
    private UUID groupId;

    /** Who physically paid; defaults to the authenticated user */
    private UUID paidBy;

    /** EQUAL | PERCENT | CUSTOM — required when groupId is set */
    private String splitType;

    @Valid
    private List<SplitRequest> splits;

    private String receiptUrl;

    /** SHA-256 hash of the receipt file for duplicate detection (nullable). */
    private String receiptHash;

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public UUID getPaidBy() { return paidBy; }
    public void setPaidBy(UUID paidBy) { this.paidBy = paidBy; }
    public String getSplitType() { return splitType; }
    public void setSplitType(String splitType) { this.splitType = splitType; }
    public List<SplitRequest> getSplits() { return splits; }
    public void setSplits(List<SplitRequest> splits) { this.splits = splits; }
    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }
    public String getReceiptHash() { return receiptHash; }
    public void setReceiptHash(String receiptHash) { this.receiptHash = receiptHash; }
}
