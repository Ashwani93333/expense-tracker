package com.expensetracker.notification;

import com.expensetracker.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/users/me/category-limits")
public class CategoryExpenseLimitController {

    private final CategoryExpenseLimitService limitService;

    public CategoryExpenseLimitController(CategoryExpenseLimitService limitService) {
        this.limitService = limitService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryExpenseLimitService.CategoryLimitDto>> getLimits(
            @AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(limitService.getLimits(principal.getId()));
    }

    @PutMapping("/{categoryId}")
    public ResponseEntity<CategoryExpenseLimitService.CategoryLimitDto> setLimit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID categoryId,
            @RequestBody Map<String, BigDecimal> body) {
        BigDecimal amount = body.get("limitAmount");
        return ResponseEntity.ok(limitService.setLimit(principal.getId(), categoryId, amount));
    }

    @DeleteMapping("/{categoryId}")
    public ResponseEntity<Map<String, String>> removeLimit(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID categoryId) {
        limitService.removeLimit(principal.getId(), categoryId);
        return ResponseEntity.ok(Map.of("message", "Category limit removed"));
    }
}
