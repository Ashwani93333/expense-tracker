package com.expensetracker.group.dto;

import com.expensetracker.model.ExpenseGroup;

import java.time.OffsetDateTime;
import java.util.UUID;

public class GroupDto {
    private UUID id;
    private String name;
    private String description;
    private UUID createdById;
    private String createdByName;
    private String currencyCode;
    private String inviteCode;
    private Boolean isActive;
    private OffsetDateTime createdAt;
    private long memberCount;
    private String currentUserRole; // ADMIN or MEMBER

    public static GroupDto fromEntity(ExpenseGroup g, long memberCount, String currentUserRole) {
        GroupDto dto = new GroupDto();
        dto.setId(g.getId());
        dto.setName(g.getName());
        dto.setDescription(g.getDescription());
        dto.setCreatedById(g.getCreatedBy().getId());
        dto.setCreatedByName(g.getCreatedBy().getFullName());
        dto.setCurrencyCode(g.getCurrencyCode());
        dto.setInviteCode(g.getInviteCode());
        dto.setIsActive(g.getIsActive());
        dto.setCreatedAt(g.getCreatedAt());
        dto.setMemberCount(memberCount);
        dto.setCurrentUserRole(currentUserRole);
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public UUID getCreatedById() { return createdById; }
    public void setCreatedById(UUID createdById) { this.createdById = createdById; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }
    public Boolean getIsActive() { return isActive; }
    public void setIsActive(Boolean isActive) { this.isActive = isActive; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public long getMemberCount() { return memberCount; }
    public void setMemberCount(long memberCount) { this.memberCount = memberCount; }
    public String getCurrentUserRole() { return currentUserRole; }
    public void setCurrentUserRole(String currentUserRole) { this.currentUserRole = currentUserRole; }
}
