package com.expensetracker.income;

import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.income.dto.CreateIncomeRequest;
import com.expensetracker.income.dto.IncomeDto;
import com.expensetracker.income.dto.UpdateIncomeRequest;
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
@RequestMapping("/api/incomes")
public class IncomeController {

    private final IncomeService incomeService;
    private final UserRepository userRepository;

    public IncomeController(IncomeService incomeService, UserRepository userRepository) {
        this.incomeService = incomeService;
        this.userRepository = userRepository;
    }

    @PostMapping
    public ResponseEntity<IncomeDto> createIncome(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateIncomeRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(incomeService.createIncome(user, request));
    }

    @GetMapping
    public ResponseEntity<List<IncomeDto>> listIncomes(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(incomeService.getPersonalIncomes(user, month, year, dateFrom, dateTo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<IncomeDto> getIncome(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(incomeService.getIncomeById(user, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<IncomeDto> updateIncome(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody UpdateIncomeRequest request) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(incomeService.updateIncome(user, id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteIncome(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        User user = resolveUser(principal);
        incomeService.deleteIncome(user, id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(incomeService.getIncomeSummary(user, month, year, dateFrom, dateTo));
    }

    @GetMapping("/overview")
    public ResponseEntity<Map<String, Object>> getOverview(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String month,
            @RequestParam(required = false) String year,
            @RequestParam(required = false) String dateFrom,
            @RequestParam(required = false) String dateTo) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(incomeService.getFinancialOverview(user, month, year, dateFrom, dateTo));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }
}
