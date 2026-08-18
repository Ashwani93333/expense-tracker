package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_monthly_reports", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"group_id", "month"})
})
public class GroupMonthlyReport {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "total_spent", nullable = false, precision = 14, scale = 2)
    private BigDecimal totalSpent;

    @Column(name = "total_budget", precision = 14, scale = 2)
    private BigDecimal totalBudget;

    /** JSON stored as TEXT (avoids JSONB type mismatch with plain JDBC/JPA) */
    @Column(name = "category_breakdown", columnDefinition = "TEXT")
    private String categoryBreakdown;

    @Column(name = "member_breakdown", columnDefinition = "TEXT")
    private String memberBreakdown;

    @Column(name = "top_merchants", columnDefinition = "TEXT")
    private String topMerchants;

    @CreationTimestamp
    @Column(name = "generated_at", updatable = false)
    private OffsetDateTime generatedAt;

    public GroupMonthlyReport() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ExpenseGroup getGroup() { return group; }
    public void setGroup(ExpenseGroup group) { this.group = group; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public BigDecimal getTotalSpent() { return totalSpent; }
    public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
    public BigDecimal getTotalBudget() { return totalBudget; }
    public void setTotalBudget(BigDecimal totalBudget) { this.totalBudget = totalBudget; }
    public String getCategoryBreakdown() { return categoryBreakdown; }
    public void setCategoryBreakdown(String categoryBreakdown) { this.categoryBreakdown = categoryBreakdown; }
    public String getMemberBreakdown() { return memberBreakdown; }
    public void setMemberBreakdown(String memberBreakdown) { this.memberBreakdown = memberBreakdown; }
    public String getTopMerchants() { return topMerchants; }
    public void setTopMerchants(String topMerchants) { this.topMerchants = topMerchants; }
    public OffsetDateTime getGeneratedAt() { return generatedAt; }
    public void setGeneratedAt(OffsetDateTime generatedAt) { this.generatedAt = generatedAt; }
}
