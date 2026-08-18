package com.expensetracker.notification.dto;

import com.expensetracker.model.Notification;

import java.time.OffsetDateTime;
import java.util.UUID;

public class NotificationDto {
    private UUID id;
    private String type;
    private String title;
    private String message;
    private UUID referenceId;
    private String referenceType;
    private Boolean isRead;
    private OffsetDateTime readAt;
    private OffsetDateTime createdAt;

    public static NotificationDto fromEntity(Notification n) {
        NotificationDto dto = new NotificationDto();
        dto.setId(n.getId());
        dto.setType(n.getType());
        dto.setTitle(n.getTitle());
        dto.setMessage(n.getMessage());
        dto.setReferenceId(n.getReferenceId());
        dto.setReferenceType(n.getReferenceType());
        dto.setIsRead(n.getIsRead());
        dto.setReadAt(n.getReadAt());
        dto.setCreatedAt(n.getCreatedAt());
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }
    public UUID getReferenceId() { return referenceId; }
    public void setReferenceId(UUID referenceId) { this.referenceId = referenceId; }
    public String getReferenceType() { return referenceType; }
    public void setReferenceType(String referenceType) { this.referenceType = referenceType; }
    public Boolean getIsRead() { return isRead; }
    public void setIsRead(Boolean isRead) { this.isRead = isRead; }
    public OffsetDateTime getReadAt() { return readAt; }
    public void setReadAt(OffsetDateTime readAt) { this.readAt = readAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
