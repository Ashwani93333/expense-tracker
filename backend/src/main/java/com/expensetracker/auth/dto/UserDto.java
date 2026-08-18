package com.expensetracker.auth.dto;

import com.expensetracker.model.Role;
import com.expensetracker.model.User;

import java.time.OffsetDateTime;
import java.util.UUID;

public class UserDto {
    private UUID id;
    private String fullName;
    private String email;
    private String avatarUrl;
    private Role role;
    private Boolean isActive;
    private OffsetDateTime createdAt;

    public UserDto() {}

    public UserDto(UUID id, String fullName, String email, String avatarUrl, Role role, Boolean isActive, OffsetDateTime createdAt) {
        this.id = id;
        this.fullName = fullName;
        this.email = email;
        this.avatarUrl = avatarUrl;
        this.role = role;
        this.isActive = isActive;
        this.createdAt = createdAt;
    }

    public static UserDtoBuilder builder() {
        return new UserDtoBuilder();
    }

    public static class UserDtoBuilder {
        private UUID id;
        private String fullName;
        private String email;
        private String avatarUrl;
        private Role role;
        private Boolean isActive;
        private OffsetDateTime createdAt;

        public UserDtoBuilder id(UUID id) { this.id = id; return this; }
        public UserDtoBuilder fullName(String fullName) { this.fullName = fullName; return this; }
        public UserDtoBuilder email(String email) { this.email = email; return this; }
        public UserDtoBuilder avatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; return this; }
        public UserDtoBuilder role(Role role) { this.role = role; return this; }
        public UserDtoBuilder isActive(Boolean isActive) { this.isActive = isActive; return this; }
        public UserDtoBuilder createdAt(OffsetDateTime createdAt) { this.createdAt = createdAt; return this; }

        public UserDto build() {
            return new UserDto(id, fullName, email, avatarUrl, role, isActive, createdAt);
        }
    }

    public static UserDto fromEntity(User user) {
        if (user == null) return null;
        return UserDto.builder()
                .id(user.getId())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .avatarUrl(user.getAvatarUrl())
                .role(user.getRole())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
