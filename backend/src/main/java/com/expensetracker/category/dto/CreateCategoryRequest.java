package com.expensetracker.category.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;

public class CreateCategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Name must be at most 100 characters")
    private String name;

    @Size(max = 50, message = "Icon must be at most 50 characters")
    private String icon;

    @Size(max = 20, message = "Color must be at most 20 characters")
    private String color;

    /** Optional classification keywords used for automatic category assignment. */
    private List<@Size(max = 60, message = "Keyword must be at most 60 characters") String> keywords;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getIcon() { return icon; }
    public void setIcon(String icon) { this.icon = icon; }
    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
    public List<String> getKeywords() { return keywords; }
    public void setKeywords(List<String> keywords) { this.keywords = keywords; }
}
