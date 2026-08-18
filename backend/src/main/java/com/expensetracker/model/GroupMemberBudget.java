package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_member_budgets", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"group_id", "user_id", "month"})
})
public class GroupMemberBudget {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "budget_limit", nullable = false, precision = 14, scale = 2)
    private BigDecimal budgetLimit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "set_by", nullable = false)
    private User setBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public GroupMemberBudget() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ExpenseGroup getGroup() { return group; }
    public void setGroup(ExpenseGroup group) { this.group = group; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public BigDecimal getBudgetLimit() { return budgetLimit; }
    public void setBudgetLimit(BigDecimal budgetLimit) { this.budgetLimit = budgetLimit; }
    public User getSetBy() { return setBy; }
    public void setSetBy(User setBy) { this.setBy = setBy; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
