package com.expensetracker.category;

import com.expensetracker.category.dto.CategoryDto;
import com.expensetracker.category.dto.CreateCategoryRequest;
import com.expensetracker.exception.AccessDeniedException;
import com.expensetracker.exception.BadRequestException;
import com.expensetracker.exception.ResourceNotFoundException;
import com.expensetracker.model.Category;
import com.expensetracker.model.User;
import com.expensetracker.repository.CategoryRepository;
import com.expensetracker.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserRepository userRepository;
    private final ObjectMapper objectMapper;

    public CategoryService(CategoryRepository categoryRepository, UserRepository userRepository,
                           ObjectMapper objectMapper) {
        this.categoryRepository = categoryRepository;
        this.userRepository = userRepository;
        this.objectMapper = objectMapper;
    }

    /** System defaults plus the current user's own custom categories. */
    @Transactional(readOnly = true)
    public List<CategoryDto> getCategoriesForUser(UUID userId) {
        return categoryRepository.findDefaultsAndUserCategories(userId)
                .stream()
                .map(CategoryDto::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional
    public CategoryDto createCategory(UUID userId, CreateCategoryRequest request) {
        if (categoryRepository.existsByNameIgnoreCaseAndCreatedByIsNull(request.getName())) {
            throw new BadRequestException("A default category with name '" + request.getName() + "' already exists");
        }
        if (categoryRepository.existsByNameIgnoreCaseAndCreatedById(request.getName(), userId)) {
            throw new BadRequestException("You already have a category named '" + request.getName() + "'");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));
        Category category = new Category();
        category.setName(request.getName().trim());
        category.setIcon(request.getIcon());
        category.setColor(request.getColor());
        category.setIsDefault(false);
        category.setCreatedBy(user);
        category.setKeywords(CategoryKeywords.toJson(objectMapper, request.getKeywords()));
        return CategoryDto.fromEntity(categoryRepository.save(category));
    }

    @Transactional
    public CategoryDto updateCategory(UUID userId, UUID id, CreateCategoryRequest request) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        ensureOwner(category, userId);
        category.setName(request.getName().trim());
        if (request.getIcon() != null) category.setIcon(request.getIcon());
        if (request.getColor() != null) category.setColor(request.getColor());
        if (request.getKeywords() != null) {
            category.setKeywords(CategoryKeywords.toJson(objectMapper, request.getKeywords()));
        }
        return CategoryDto.fromEntity(categoryRepository.save(category));
    }

    @Transactional
    public void deleteCategory(UUID userId, UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        ensureOwner(category, userId);
        categoryRepository.delete(category);
    }

    private static void ensureOwner(Category category, UUID userId) {
        if (Boolean.TRUE.equals(category.getIsDefault())) {
            throw new BadRequestException("Cannot modify a default category");
        }
        if (category.getCreatedBy() == null || !category.getCreatedBy().getId().equals(userId)) {
            throw new AccessDeniedException("You can only modify your own categories");
        }
    }
}
