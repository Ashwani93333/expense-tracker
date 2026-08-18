package com.expensetracker.repository;

import com.expensetracker.model.UserBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserBudgetRepository extends JpaRepository<UserBudget, UUID> {

    /** Overall budget: category_id IS NULL */
    Optional<UserBudget> findByUserIdAndCategoryIdIsNullAndMonth(UUID userId, LocalDate month);

    /** Category-scoped budget */
    Optional<UserBudget> findByUserIdAndCategoryIdAndMonth(UUID userId, UUID categoryId, LocalDate month);

    /** All budgets for a user in a given month */
    List<UserBudget> findByUserIdAndMonth(UUID userId, LocalDate month);
}
