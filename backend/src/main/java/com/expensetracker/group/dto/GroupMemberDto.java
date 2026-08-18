package com.expensetracker.group.dto;

import com.expensetracker.model.GroupMember;

import java.time.OffsetDateTime;
import java.util.UUID;

public class GroupMemberDto {
    private UUID memberId;
    private UUID userId;
    private String userName;
    private String userEmail;
    private String avatarUrl;
    private String role;
    private String status;
    private OffsetDateTime joinedAt;

    public static GroupMemberDto fromEntity(GroupMember gm) {
        GroupMemberDto dto = new GroupMemberDto();
        dto.setMemberId(gm.getId());
        dto.setUserId(gm.getUser().getId());
        dto.setUserName(gm.getUser().getFullName());
        dto.setUserEmail(gm.getUser().getEmail());
        dto.setAvatarUrl(gm.getUser().getAvatarUrl());
        dto.setRole(gm.getRole());
        dto.setStatus(gm.getStatus());
        dto.setJoinedAt(gm.getJoinedAt());
        return dto;
    }

    public UUID getMemberId() { return memberId; }
    public void setMemberId(UUID memberId) { this.memberId = memberId; }
    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }
    public String getUserName() { return userName; }
    public void setUserName(String userName) { this.userName = userName; }
    public String getUserEmail() { return userEmail; }
    public void setUserEmail(String userEmail) { this.userEmail = userEmail; }
    public String getAvatarUrl() { return avatarUrl; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public OffsetDateTime getJoinedAt() { return joinedAt; }
    public void setJoinedAt(OffsetDateTime joinedAt) { this.joinedAt = joinedAt; }
}
