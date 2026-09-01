package com.expensetracker.income.dto;

import com.expensetracker.income.IncomeSource;
import com.expensetracker.model.Income;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

public class IncomeDto {
    private UUID id;
    private UUID userId;
    private String userName;
    private BigDecimal amount;
    private String description;
    private LocalDate incomeDate;
    private IncomeSource source;
    private String sourceLabel;
    private Boolean isRecurring;
    private String frequency;
    private String notes;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static IncomeDto fromEntity(Income i) {
        IncomeDto dto = new IncomeDto();
        dto.setId(i.getId());
        dto.setUserId(i.getUser().getId());
        dto.setUserName(i.getUser().getFullName());
        dto.setAmount(i.getAmount());
        dto.setDescription(i.getDescription());
        dto.setIncomeDate(i.getIncomeDate());
        dto.setSource(i.getSource());
        dto.setSourceLabel(formatSource(i.getSource()));
        dto.setIsRecurring(i.getIsRecurring());
        dto.setFrequency(i.getFrequency());
        dto.setNotes(i.getNotes());
        dto.setCreatedAt(i.getCreatedAt());
        dto.setUpdatedAt(i.getUpdatedAt());
        return dto;
    }

    private static String formatSource(IncomeSource source) {
        if (source == null) return "Other";
        return switch (source) {
            case SALARY -> "Salary";
            case FREELANCE -> "Freelance";
            case INVESTMENTS -> "Investments";
            case BUSINESS -> "Business";
            case RENTAL -> "Rental Income";
            case GIFTS -> "Gifts";
            case REFUNDS -> "Refunds";
            case OTHER -> "Other";
        };
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getIncomeDate() { return incomeDate; }
    public void setIncomeDate(LocalDate incomeDate) { this.incomeDate = incomeDate; }
    public IncomeSource getSource() { return source; }
    public void setSource(IncomeSource source) { this.source = source; }
    public String getSourceLabel() { return sourceLabel; }
    public void setSourceLabel(String sourceLabel) { this.sourceLabel = sourceLabel; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
