package com.expensetracker.group.dto;

import jakarta.validation.constraints.NotNull;

import java.util.List;

public class UpdateMemberPermissionsRequest {

    @NotNull
    private List<String> permissions;

    public List<String> getPermissions() { return permissions; }
    public void setPermissions(List<String> permissions) { this.permissions = permissions; }
}
