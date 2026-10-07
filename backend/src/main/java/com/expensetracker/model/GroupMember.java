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

    /**
     * Comma-separated feature grants (see com.expensetracker.group.GroupPermission).
     * Empty/NULL means the member has no feature access beyond viewing group data.
     * ADMINs implicitly hold every permission regardless of this column.
     */
    @Column(name = "permissions", columnDefinition = "TEXT")
    private String permissions;

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
    public String getPermissions() { return permissions; }
    public void setPermissions(String permissions) { this.permissions = permissions; }

    /** Granted permission keys; empty list when nothing has been granted. */
    public java.util.List<String> getPermissionList() {
        if (permissions == null || permissions.isBlank()) {
            return java.util.List.of();
        }
        return java.util.Arrays.stream(permissions.split(","))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .collect(java.util.stream.Collectors.toList());
    }

    public void setPermissionList(java.util.List<String> keys) {
        this.permissions = (keys == null || keys.isEmpty())
                ? null
                : String.join(",", keys);
    }

    public boolean hasPermission(String permissionKey) {
        if ("ADMIN".equals(role)) {
            return true;
        }
        return getPermissionList().contains(permissionKey);
    }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }
}
