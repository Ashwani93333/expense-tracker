package com.expensetracker.expense.dto;

import com.expensetracker.model.Expense;
import com.expensetracker.model.ExpenseSplit;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

public class ExpenseDto {
    private UUID id;
    private UUID userId;
    private String userName;
    private UUID categoryId;
    private String categoryName;
    private UUID groupId;
    private String groupName;
    private UUID paidById;
    private String paidByName;
    private BigDecimal amount;
    private String description;
    private LocalDate expenseDate;
    private String splitType;
    private String receiptUrl;
    private String categorySource;
    private Double categoryConfidence;
    private List<ExpenseSplitDto> splits;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ExpenseDto fromEntity(Expense e, List<ExpenseSplit> splits) {
        ExpenseDto dto = new ExpenseDto();
        dto.setId(e.getId());
        dto.setUserId(e.getUser().getId());
        dto.setUserName(e.getUser().getFullName());
        if (e.getCategory() != null) {
            dto.setCategoryId(e.getCategory().getId());
            dto.setCategoryName(e.getCategory().getName());
        }
        if (e.getGroup() != null) {
            dto.setGroupId(e.getGroup().getId());
            dto.setGroupName(e.getGroup().getName());
        }
        if (e.getPaidBy() != null) {
            dto.setPaidById(e.getPaidBy().getId());
            dto.setPaidByName(e.getPaidBy().getFullName());
        }
        dto.setAmount(e.getAmount());
        dto.setDescription(e.getDescription());
        dto.setExpenseDate(e.getExpenseDate());
        dto.setSplitType(e.getSplitType());
        dto.setReceiptUrl(e.getReceiptUrl());
        dto.setCategorySource(e.getCategorySource());
        dto.setCategoryConfidence(e.getCategoryConfidence());
        dto.setCreatedAt(e.getCreatedAt());
        dto.setUpdatedAt(e.getUpdatedAt());
        if (splits != null) {
            dto.setSplits(splits.stream().map(ExpenseSplitDto::fromEntity).collect(Collectors.toList()));
        }
        return dto;
    }

    public static ExpenseDto fromEntity(Expense e) {
        return fromEntity(e, null);
    }

    // --- inner DTO ---
    public static class ExpenseSplitDto {
        private UUID id;
        private UUID userId;
        private String userName;
        private BigDecimal shareAmount;
        private BigDecimal sharePercent;
        private Boolean isSettled;
        private OffsetDateTime settledAt;

        public static ExpenseSplitDto fromEntity(ExpenseSplit es) {
            ExpenseSplitDto dto = new ExpenseSplitDto();
            dto.setId(es.getId());
            dto.setUserId(es.getUser().getId());
            dto.setUserName(es.getUser().getFullName());
            dto.setShareAmount(es.getShareAmount());
            dto.setSharePercent(es.getSharePercent());
            dto.setIsSettled(es.getIsSettled());
            dto.setSettledAt(es.getSettledAt());
            return dto;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public UUID getUserId() { return userId; }
        public void setUserId(UUID userId) { this.userId = userId; }
        public String getUserName() { return userName; }
        public void setUserName(String userName) { this.userName = userName; }
        public BigDecimal getShareAmount() { return shareAmount; }
        public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }
        public BigDecimal getSharePercent() { return sharePercent; }
        public void setSharePercent(BigDecimal sharePercent) { this.sharePercent = sharePercent; }
        public Boolean getIsSettled() { return isSettled; }
        public void setIsSettled(Boolean isSettled) { this.isSettled = isSettled; }
        public OffsetDateTime getSettledAt() { return settledAt; }
        public void setSettledAt(OffsetDateTime settledAt) { this.settledAt = settledAt; }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public String getCategoryName() { return categoryName; }
    public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
    public UUID getGroupId() { return groupId; }
    public void setGroupId(UUID groupId) { this.groupId = groupId; }
    public String getGroupName() { return groupName; }
    public void setGroupName(String groupName) { this.groupName = groupName; }
    public UUID getPaidById() { return paidById; }
    public void setPaidById(UUID paidById) { this.paidById = paidById; }
    public String getPaidByName() { return paidByName; }
    public void setPaidByName(String paidByName) { this.paidByName = paidByName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getExpenseDate() { return expenseDate; }
    public void setExpenseDate(LocalDate expenseDate) { this.expenseDate = expenseDate; }
    public String getSplitType() { return splitType; }
    public void setSplitType(String splitType) { this.splitType = splitType; }
    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }
    public String getCategorySource() { return categorySource; }
    public void setCategorySource(String categorySource) { this.categorySource = categorySource; }
    public Double getCategoryConfidence() { return categoryConfidence; }
    public void setCategoryConfidence(Double categoryConfidence) { this.categoryConfidence = categoryConfidence; }
    public List<ExpenseSplitDto> getSplits() { return splits; }
    public void setSplits(List<ExpenseSplitDto> splits) { this.splits = splits; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
