package com.expensetracker.category.dto;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public class CategoryDto {
    private UUID id;
    private String name;
    private String icon;
    private String color;
    private Boolean isDefault;
    private List<String> keywords;
    private UUID createdByUserId;
    private String createdByUserName;
    private OffsetDateTime createdAt;

    public CategoryDto() {}

    public static CategoryDto fromEntity(com.expensetracker.model.Category c) {
        CategoryDto dto = new CategoryDto();
        dto.setId(c.getId());
        dto.setName(c.getName());
        dto.setIcon(c.getIcon());
        dto.setColor(c.getColor());
        dto.setIsDefault(c.getIsDefault());
        dto.setKeywords(com.expensetracker.category.CategoryKeywords.parse(c.getKeywords()));
        if (c.getCreatedBy() != null) {
            dto.setCreatedByUserId(c.getCreatedBy().getId());
            dto.setCreatedByUserName(c.getCreatedBy().getFullName());
        }
        dto.setCreatedAt(c.getCreatedAt());
        return dto;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public Boolean getIsDefault() { return isDefault; }
    public void setIsDefault(Boolean isDefault) { this.isDefault = isDefault; }
    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }
    public UUID getCreatedByUserId() { return createdByUserId; }
    public void setCreatedByUserId(UUID createdByUserId) { this.createdByUserId = createdByUserId; }
    public String getCreatedByUserName() { return createdByUserName; }
    public void setCreatedByUserName(String createdByUserName) { this.createdByUserName = createdByUserName; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
