package com.expensetracker.group.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;

public class CreateInviteRequest {

    @Email(message = "Must be a valid email address")
    private String email;

    private OffsetDateTime expiresAt;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
