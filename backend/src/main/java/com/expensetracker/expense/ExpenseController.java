package com.expensetracker.expense;

import com.expensetracker.expense.dto.CreateExpenseRequest;
import com.expensetracker.expense.dto.ExpenseDto;
import com.expensetracker.expense.dto.ReviewExpenseRequest;
import com.expensetracker.expense.dto.SplitRequest;
import com.expensetracker.expense.dto.UpdateExpenseRequest;
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
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;
    private final UserRepository userRepository;

    public ExpenseController(ExpenseService expenseService, UserRepository userRepository) {
        this.expenseService = expenseService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<ExpenseDto> createExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateExpenseRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(expenseService.createExpense(user, request));
    }

    @GetMapping
    public ResponseEntity<List<ExpenseDto>> listExpenses(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.getPersonalExpenses(user, month));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExpenseDto> getExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.getExpenseById(user, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExpenseDto> updateExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateExpenseRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.updateExpense(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        expenseService.deleteExpense(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getMonthlySummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.getMonthlySummary(user, month));
    }

    @PatchMapping("/{id}/splits")
    public ResponseEntity<ExpenseDto> updateSplits(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody List<SplitRequest> splits) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.updateSplits(user, id, splits));
    }

    @PatchMapping("/{id}/splits/{userId}/settle")
    public ResponseEntity<ExpenseDto> settleShare(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @PathVariable UUID userId) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.settleShare(user, id, userId));
    }

    /** Group admin approval/rejection of a member's pending payment. */
    @PatchMapping("/{id}/approval")
    public ResponseEntity<ExpenseDto> reviewExpense(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody ReviewExpenseRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(expenseService.reviewExpense(user, id, request.getAction(), request.getNote()));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.expensetracker.exception.ResourceNotFoundException("User not found"));
    }
}
