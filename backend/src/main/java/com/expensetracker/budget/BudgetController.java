package com.expensetracker.budget;

import com.expensetracker.budget.dto.BudgetStatusResponse;
import com.expensetracker.budget.dto.SetBudgetRequest;
import com.expensetracker.model.User;
import com.expensetracker.repository.UserRepository;
import com.expensetracker.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/me")
public class BudgetController {

    private final BudgetService budgetService;
    private final UserRepository userRepository;

    public BudgetController(BudgetService budgetService, UserRepository userRepository) {
        this.budgetService = budgetService;
        this.userRepository = userRepository;
    }

    @PutMapping("/budget")
    public ResponseEntity<BudgetStatusResponse> setPersonalBudget(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month,
            @Valid @RequestBody SetBudgetRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(budgetService.setPersonalBudget(user, request, month));
    }

    @GetMapping("/budget/status")
    public ResponseEntity<List<BudgetStatusResponse>> getPersonalBudgetStatus(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(budgetService.getPersonalBudgetStatus(user, month));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.expensetracker.exception.ResourceNotFoundException("User not found"));
    }
}
