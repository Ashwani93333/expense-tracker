package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_members", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"group_id", "user_id"})
})
public class GroupMember {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /** ADMIN or MEMBER */
    @Column(name = "role", nullable = false, length = 20)
    private String role = "MEMBER";

    /** ACTIVE, LEFT, REMOVED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "ACTIVE";

    @CreationTimestamp
    @Column(name = "joined_at", updatable = false)
    private OffsetDateTime joinedAt;

    public GroupMember() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ExpenseGroup getGroup() { return group; }
    public void setGroup(ExpenseGroup group) { this.group = group; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }
}
