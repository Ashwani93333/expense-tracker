package com.expensetracker.expense.ocr;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

public class ReceiptAnalysisResponse {
    private String merchantName;
    private BigDecimal totalAmount;
    private LocalDate date;
    /** Raw category guess from the AI (nullable). */
    private String category;
    /** Resolved category id after classification (nullable). */
    private UUID categoryId;
    /** RULE_BASED | AI | USER | FALLBACK */
    private String categorySource;
    private Double categoryConfidence;
    /** Stored receipt filename (for linking back to the expense). */
    private String receiptUrl;
    /** SHA-256 hex digest of the receipt file (for duplicate detection). */
    private String receiptHash;

    public String getMerchantName() { return merchantName; }
    public void setMerchantName(String merchantName) { this.merchantName = merchantName; }
    public BigDecimal getTotalAmount() { return totalAmount; }
    public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public UUID getCategoryId() { return categoryId; }
    public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
    public String getCategorySource() { return categorySource; }
    public void setCategorySource(String categorySource) { this.categorySource = categorySource; }
    public Double getCategoryConfidence() { return categoryConfidence; }
    public void setCategoryConfidence(Double categoryConfidence) { this.categoryConfidence = categoryConfidence; }
    public String getReceiptUrl() { return receiptUrl; }
    public void setReceiptUrl(String receiptUrl) { this.receiptUrl = receiptUrl; }
    public String getReceiptHash() { return receiptHash; }
    public void setReceiptHash(String receiptHash) { this.receiptHash = receiptHash; }
}
