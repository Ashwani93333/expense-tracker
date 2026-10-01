package com.expensetracker.repository;

import com.expensetracker.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface CategoryRepository extends JpaRepository<Category, UUID> {
    List<Category> findByIsDefaultTrue();
    boolean existsByNameIgnoreCase(String name);

    boolean existsByNameIgnoreCaseAndCreatedByIsNull(String name);

    boolean existsByNameIgnoreCaseAndCreatedById(String name, UUID userId);

    /** System default categories plus the given user's own custom categories. */
    @org.springframework.data.jpa.repository.Query("SELECT c FROM Category c " +
            "WHERE c.isDefault = true OR (c.createdBy.id = :userId AND c.isDefault <> true)")
    List<Category> findDefaultsAndUserCategories(@org.springframework.data.repository.query.Param("userId") UUID userId);

    /**
     * Categories already used by at least one of the user's expenses. Used to keep
     * historical categories visible after the user narrows their preferred set,
     * so old rows never lose their label.
     */
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT e.category FROM Expense e " +
            "WHERE e.user.id = :userId AND e.category IS NOT NULL")
    List<Category> findCategoriesUsedByUser(@org.springframework.data.repository.query.Param("userId") UUID userId);

    Optional<Category> findByNameIgnoreCase(String name);
}
