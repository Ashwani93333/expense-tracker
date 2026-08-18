package com.expensetracker.model;

import jakarta.persistence.*;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "expense_splits", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"expense_id", "user_id"})
})
public class ExpenseSplit {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "expense_id", nullable = false)
    private Expense expense;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "share_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal shareAmount;

    @Column(name = "share_percent", precision = 5, scale = 2)
    private BigDecimal sharePercent;

    @Column(name = "is_settled")
    private Boolean isSettled = false;

    @Column(name = "settled_at")
    private OffsetDateTime settledAt;

    public ExpenseSplit() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public Expense getExpense() { return expense; }
    public void setExpense(Expense expense) { this.expense = expense; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public BigDecimal getShareAmount() { return shareAmount; }
    public void setShareAmount(BigDecimal shareAmount) { this.shareAmount = shareAmount; }
    public BigDecimal getSharePercent() { return sharePercent; }
    public void setSharePercent(BigDecimal sharePercent) { this.sharePercent = sharePercent; }
    public Boolean getIsSettled() { return isSettled; }
    public void setIsSettled(Boolean isSettled) { this.isSettled = isSettled; }
    public OffsetDateTime getSettledAt() { return settledAt; }
    public void setSettledAt(OffsetDateTime settledAt) { this.settledAt = settledAt; }
}
