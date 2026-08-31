package com.expensetracker.group;

import com.expensetracker.expense.ExpenseService;
import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.expense.dto.ExpenseDto;
import com.expensetracker.group.dto.*;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    public GroupController(GroupService groupService, ExpenseService expenseService,
                           UserRepository userRepository) {
        this.groupService = groupService;
        this.expenseService = expenseService;
        this.userRepository = userRepository;
    }

    // ---- Group CRUD ----

    @PostMapping
    public ResponseEntity<GroupDto> createGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateGroupRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createGroup(user, request));
    }

    @GetMapping
    public ResponseEntity<List<GroupDto>> listGroups(
            @AuthenticationPrincipal UserPrincipal principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupService.getGroupsForUser(user));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getGroupDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupService.getGroupDetail(user, id));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<GroupDto> updateGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateGroupRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupService.updateGroup(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deactivateGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        groupService.deactivateGroup(user, id);
        return ResponseEntity.ok(Map.of("message", "Group deactivated"));
    }

    // ---- Invites ----

    @PostMapping("/{id}/invites")
    public ResponseEntity<Map<String, Object>> createInvite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateInviteRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(groupService.createInvite(user, id, request));
    }

    @PostMapping("/join")
    public ResponseEntity<GroupDto> joinGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody JoinGroupRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupService.joinGroup(user, request));
    }

    /** Public invite preview used before accepting — returns no sensitive token material. */
    @GetMapping("/invites/{token}")
    public ResponseEntity<Map<String, Object>> getInviteInfo(@PathVariable String token) {
        return ResponseEntity.ok(groupService.getInviteInfo(token));
    }

    @PostMapping("/{id}/invites/{inviteId}/resend")
    public ResponseEntity<Map<String, Object>> resendInvite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID inviteId) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupService.resendInvite(user, id, inviteId));
    }

    // ---- Member management ----

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Map<String, String>> removeMember(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        User user = resolveUser(principal);
        groupService.removeMember(user, id, userId);
        return ResponseEntity.ok(Map.of("message", "Member removed"));
    }

    @PostMapping("/{id}/leave")
    public ResponseEntity<Map<String, String>> leaveGroup(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        groupService.leaveGroup(user, id);
        return ResponseEntity.ok(Map.of("message", "You have left the group"));
    }

    @PatchMapping("/{id}/members/{userId}/role")
    public ResponseEntity<GroupMemberDto> updateMemberRole(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @RequestBody Map<String, String> body) {
        User user = resolveUser(principal);
        String newRole = body.get("role");
        return ResponseEntity.ok(groupService.updateMemberRole(user, id, userId, newRole));
    }

    // ---- Group Expenses ----

    @PostMapping("/{id}/expenses")
    public ResponseEntity<ExpenseDto> createGroupExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateExpenseRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createGroupExpense(user, id, request));
    }

    @GetMapping("/{id}/expenses")
    public ResponseEntity<List<ExpenseDto>> getGroupExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo,
            @RequestParam(required = false) String status) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.getGroupExpenses(user, id, month, year, dateFrom, dateTo, status));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.expensetracker.exception.ResourceNotFoundException("User not found"));
    }
}
