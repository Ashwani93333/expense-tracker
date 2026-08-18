package com.expensetracker.group.dto;

import jakarta.validation.constraints.Size;

public class UpdateGroupRequest {

    @Size(max = 150)
    private String name;

    private String description;

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
}
