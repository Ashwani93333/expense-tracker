package com.expensetracker.income.dto;

import com.expensetracker.income.IncomeSource;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

public class UpdateIncomeRequest {

    @DecimalMin(value = "0.01", message = "Amount must be greater than 0")
    private BigDecimal amount;

    @Size(max = 500, message = "Description must be at most 500 characters")
    private String description;

    private LocalDate incomeDate;

    private IncomeSource source;

    private Boolean isRecurring;

    private String frequency;

    @Size(max = 1000, message = "Notes must be at most 1000 characters")
    private String notes;

    public BigDecimal getAmount() { return amount; }
    public void setAmount(BigDecimal amount) { this.amount = amount; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getIncomeDate() { return incomeDate; }
    public void setIncomeDate(LocalDate incomeDate) { this.incomeDate = incomeDate; }
    public IncomeSource getSource() { return source; }
    public void setSource(IncomeSource source) { this.source = source; }
    public Boolean getIsRecurring() { return isRecurring; }
    public void setIsRecurring(Boolean isRecurring) { this.isRecurring = isRecurring; }
    public String getFrequency() { return frequency; }
    public void setFrequency(String frequency) { this.frequency = frequency; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
}
