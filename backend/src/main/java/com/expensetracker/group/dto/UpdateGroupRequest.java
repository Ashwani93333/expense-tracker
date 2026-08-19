package com.expensetracker.group.dto;

import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class UpdateGroupRequest {

    @Size(max = 150)
    private String name;

    private String description;

    private OffsetDateTime expiresAt;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
}
