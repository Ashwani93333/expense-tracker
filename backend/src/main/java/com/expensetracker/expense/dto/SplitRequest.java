package com.expensetracker.expense.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.UUID;

public class SplitRequest {

    @NotNull(message = "User ID is required for split")
    private UUID userId;

    @NotNull(message = "Share amount is required")
    @DecimalMin(value = "0.01", message = "Share amount must be positive")
    private BigDecimal shareAmount;

    private BigDecimal sharePercent;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }
    public BigDecimal getSharePercent() { return sharePercent; }
    public void setSharePercent(BigDecimal sharePercent) { this.sharePercent = sharePercent; }
}
