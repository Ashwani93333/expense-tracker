package com.expensetracker.repository;

import com.expensetracker.model.CategoryExpenseLimit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryExpenseLimitRepository extends JpaRepository<CategoryExpenseLimit, UUID> {

    List<CategoryExpenseLimit> findByUserId(UUID userId);

    Optional<CategoryExpenseLimit> findByUserIdAndCategoryId(UUID userId, UUID categoryId);

    void deleteByUserIdAndCategoryId(UUID userId, UUID categoryId);
}
