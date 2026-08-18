package com.expensetracker.category;

import com.expensetracker.category.dto.CategoryDto;
import com.expensetracker.category.dto.CreateCategoryRequest;
import com.expensetracker.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ResponseEntity<List<CategoryDto>> getCategories(@AuthenticationPrincipal UserPrincipal principal) {
        return ResponseEntity.ok(categoryService.getCategoriesForUser(principal.getId()));
    }

    @PostMapping
    public ResponseEntity<CategoryDto> createCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(categoryService.createCategory(principal.getId(), request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CategoryDto> updateCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id,
            @Valid @RequestBody CreateCategoryRequest request) {
        return ResponseEntity.ok(categoryService.updateCategory(principal.getId(), id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCategory(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {
        categoryService.deleteCategory(principal.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
