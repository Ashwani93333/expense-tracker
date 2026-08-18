package com.expensetracker.group;

import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.ExpenseGroup;
import com.expensetracker.model.GroupMember;
import com.expensetracker.repository.GroupMemberRepository;
import org.springframework.stereotype.Component;

import java.util.UUID;

/**
 * Centralised admin-check used across group endpoints.
 * Throws AccessDeniedException if the caller is not an ACTIVE ADMIN of the group.
 */
@Component
public class GroupRoleGuard {

    private final GroupMemberRepository groupMemberRepository;

    public GroupRoleGuard(GroupMemberRepository groupMemberRepository) {
        this.groupMemberRepository = groupMemberRepository;
    }

    public GroupMember requireAdmin(UUID groupId, UUID userId) {
        GroupMember gm = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group"));
        if (!"ACTIVE".equals(gm.getStatus())) {
            throw new AccessDeniedException("Your membership is not active");
        }
        if (!"ADMIN".equals(gm.getRole())) {
            throw new AccessDeniedException("Only group admins can perform this action");
        }
        return gm;
    }

    public GroupMember requireMember(UUID groupId, UUID userId) {
        GroupMember gm = groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .orElseThrow(() -> new AccessDeniedException("You are not a member of this group"));
        if (!"ACTIVE".equals(gm.getStatus())) {
            throw new AccessDeniedException("Your membership is not active");
        }
        return gm;
    }

    public boolean isAdmin(UUID groupId, UUID userId) {
        return groupMemberRepository.findByGroupIdAndUserId(groupId, userId)
                .map(gm -> "ADMIN".equals(gm.getRole()) && "ACTIVE".equals(gm.getStatus()))
                .orElse(false);
    }
}
