package com.expensetracker.notification;

import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Category;
import com.expensetracker.model.CategoryExpenseLimit;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryExpenseLimitRepository;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class CategoryExpenseLimitService {

    private final CategoryExpenseLimitRepository limitRepository;
    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;

    public CategoryExpenseLimitService(CategoryExpenseLimitRepository limitRepository,
                                       CategoryRepository categoryRepository,
                                       UserRepository userRepository) {
        this.limitRepository = limitRepository;
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<CategoryLimitDto> getLimits(UUID userId) {
        return limitRepository.findByUserId(userId).stream()
                .map(CategoryLimitDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryLimitDto setLimit(UUID userId, UUID categoryId, BigDecimal limitAmount) {
        if (limitAmount == null || limitAmount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Limit amount must be positive");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        CategoryExpenseLimit limit = limitRepository.findByUserIdAndCategoryId(userId, categoryId)
                .orElse(new CategoryExpenseLimit());
        limit.setUser(user);
        limit.setCategory(category);
        limit.setLimitAmount(limitAmount);
        return CategoryLimitDto.fromEntity(limitRepository.save(limit));
    }

    @Transactional
    public void removeLimit(UUID userId, UUID categoryId) {
        limitRepository.deleteByUserIdAndCategoryId(userId, categoryId);
    }

    public static class CategoryLimitDto {
        private UUID id;
        private UUID categoryId;
        private String categoryName;
        private BigDecimal limitAmount;

        public static CategoryLimitDto fromEntity(CategoryExpenseLimit e) {
            CategoryLimitDto dto = new CategoryLimitDto();
            dto.id = e.getId();
            dto.categoryId = e.getCategory().getId();
            dto.categoryName = e.getCategory().getName();
            dto.limitAmount = e.getLimitAmount();
            return dto;
        }

        public UUID getId() { return id; }
        public void setId(UUID id) { this.id = id; }
        public UUID getCategoryId() { return categoryId; }
        public void setCategoryId(UUID categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public BigDecimal getLimitAmount() { return limitAmount; }
        public void setLimitAmount(BigDecimal limitAmount) { this.limitAmount = limitAmount; }
    }
}
