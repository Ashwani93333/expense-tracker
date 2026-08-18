package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 100)
    private String fullName;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Column(name = "avatar_url", length = 500)
    private String avatarUrl;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 20)
    private Role role = Role.ROLE_USER;

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public User() {}

    public User(UUID id, String fullName, String email, String passwordHash, String avatarUrl, Role role, Boolean isActive, OffsetDateTime createdAt, OffsetDateTime updatedAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.passwordHash = passwordHash;
        this.avatarUrl = avatarUrl;
        this.role = role != null ? role : Role.ROLE_USER;
        this.isActive = isActive != null ? isActive : true;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public static UserBuilder builder() {
        return new UserBuilder();
    }

    public static class UserBuilder {
        private UUID id;
        private String fullName;
        private String email;
        private String passwordHash;
        private String avatarUrl;
        private Role role = Role.ROLE_USER;
        private Boolean isActive = true;
        private OffsetDateTime createdAt;
        private OffsetDateTime updatedAt;

        public UserBuilder id(UUID id) { this.id = id; return this; }
        public UserBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserBuilder email(String email) { this.email = email; return this; }
        public UserBuilder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
        public UserBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserBuilder role(Role role) { this.role = role; return this; }
        public UserBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public UserBuilder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }
        public UserBuilder updatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; return this; }

        public User build() {
            return new User(id, fullName, email, passwordHash, avatarUrl, role, isActive, createdAt, updatedAt);
        }
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getPasswordHash() { return passwordHash; }
    public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}

