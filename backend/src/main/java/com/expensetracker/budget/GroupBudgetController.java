package com.expensetracker.budget;

import com.expensetracker.budget.dto.GroupBudgetStatusResponse;
import com.expensetracker.budget.dto.MemberBudgetDto;
import com.expensetracker.budget.dto.SetBudgetRequest;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/groups")
public class GroupBudgetController {

    private final GroupBudgetService groupBudgetService;
    private final UserRepository userRepository;

    public GroupBudgetController(GroupBudgetService groupBudgetService, UserRepository userRepository) {
        this.groupBudgetService = groupBudgetService;
        this.userRepository = userRepository;
    }

    /** PUT /api/groups/{id}/budget?month=2026-08 — admin sets group total budget */
    @PutMapping("/{id}/budget")
    public ResponseEntity<GroupBudgetStatusResponse> setGroupBudget(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month,
            @Valid @RequestBody SetBudgetRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(
                groupBudgetService.setGroupBudget(user, id, request.getBudgetLimit(), month));
    }

    /** GET /api/groups/{id}/budget/status?month=2026-08 — live group spend vs budget */
    @GetMapping("/{id}/budget/status")
    public ResponseEntity<GroupBudgetStatusResponse> getGroupBudgetStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupBudgetService.getGroupBudgetStatus(user, id, month));
    }

    /** PUT /api/groups/{id}/members/{userId}/budget?month=2026-08 — admin sets member cap */
    @PutMapping("/{id}/members/{userId}/budget")
    public ResponseEntity<MemberBudgetDto> setMemberBudget(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID userId,
            @RequestParam(required = false) String month,
            @Valid @RequestBody SetBudgetRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(
                groupBudgetService.setMemberBudget(user, id, userId, request.getBudgetLimit(), month));
    }

    /** GET /api/groups/{id}/members/budgets?month=2026-08 — all member caps + utilization */
    @GetMapping("/{id}/members/budgets")
    public ResponseEntity<List<MemberBudgetDto>> getMemberBudgets(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @RequestParam(required = false) String month) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(groupBudgetService.getMemberBudgets(user, id, month));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.expensetracker.exception.ResourceNotFoundException("User not found"));
    }
}
