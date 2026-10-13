package com.expensetracker.group.dto;

import com.expensetracker.group.GroupManagementMode;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.OffsetDateTime;

public class CreateGroupRequest {

    @NotBlank(message = "Group name is required")
    @Size(max = 150, message = "Name must be at most 150 characters")
    private String name;

    private String description;

    @Size(max = 3, message = "Currency code must be 3 characters")
    private String currencyCode = "INR";

    private OffsetDateTime expiresAt;

    /**
     * How spending is managed: INCOME or BUDGET. Defaults to BUDGET when omitted
     * so legacy clients keep the existing behaviour.
     */
    private GroupManagementMode managementMode;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
    public GroupManagementMode getManagementMode() { return managementMode; }
    public void setManagementMode(GroupManagementMode managementMode) { this.managementMode = managementMode; }
}
