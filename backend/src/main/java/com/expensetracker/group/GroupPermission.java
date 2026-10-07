package com.expensetracker.group;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Feature-wise grants a group admin can hand out to members.
 * A member may only perform a group action if their role is ADMIN
 * (admins implicitly hold every permission) or if the admin has explicitly
 * granted the matching permission key.
 */
public enum GroupPermission {

    ADD_EXPENSE("Add expenses", "Add new expenses to the group"),
    REVIEW_EXPENSES("Approve payments", "Verify or reject members' group payments"),
    SET_BUDGET("Set group budget", "Set or update the group's monthly budget"),
    SET_MEMBER_CAPS("Set member caps", "Set or update per-member budget caps"),
    UPDATE_EXPIRY("Update expiry", "Set or extend the group expiry date"),
    EDIT_GROUP_DETAILS("Edit group details", "Change the group name and description"),
    INVITE_MEMBERS("Invite members", "Invite new members to the group"),
    REMOVE_MEMBERS("Remove members", "Remove members from the group"),
    SETTLE_OTHERS("Settle others", "Settle another member's share on their behalf");

    private final String label;
    private final String description;

    GroupPermission(String label, String description) {
        this.label = label;
        this.description = description;
    }

    public String getKey() { return name(); }
    public String getLabel() { return label; }
    public String getDescription() { return description; }

    public static List<String> allKeys() {
        return Arrays.stream(values()).map(GroupPermission::name).collect(Collectors.toList());
    }

    public static GroupPermission fromKey(String key) {
        return Arrays.stream(values())
                .filter(p -> p.name().equals(key))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown permission: " + key));
    }
}
