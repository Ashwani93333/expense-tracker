package com.expensetracker.user.dto;

import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @Size(max = 100, message = "Full name must be at most 100 characters")
    private String fullName;

    @Size(max = 500, message = "Avatar URL must be at most 500 characters")
    private String avatarUrl;

    /** Current password, required when changing password */
    private String currentPassword;

    @Size(min = 8, message = "New password must be at least 8 characters")
    private String newPassword;

    public String getFullName() { return fullName; }
    public void setFullName(String fullName) { this.fullName = fullName; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getCurrentPassword() { return currentPassword; }
    public void setCurrentPassword(String currentPassword) { this.currentPassword = currentPassword; }
    public String getNewPassword() { return newPassword; }
    public void setNewPassword(String newPassword) { this.newPassword = newPassword; }
}
