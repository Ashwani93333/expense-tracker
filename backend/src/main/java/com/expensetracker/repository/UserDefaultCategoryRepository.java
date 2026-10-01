package com.expensetracker.repository;

import com.expensetracker.model.Category;
import com.expensetracker.model.UserDefaultCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface UserDefaultCategoryRepository extends JpaRepository<UserDefaultCategory, UUID> {

    /** The categories the user marked as their defaults. */
    @Query("SELECT d.category FROM UserDefaultCategory d WHERE d.user.id = :userId")
    List<Category> findCategoriesByUserId(@Param("userId") UUID userId);

    List<UserDefaultCategory> findByUserId(UUID userId);

    long countByUserId(UUID userId);

    /** Replaces the user's default set in one statement. */
    @Modifying
    @Query("DELETE FROM UserDefaultCategory d WHERE d.user.id = :userId")
    void deleteByUserId(@Param("userId") UUID userId);
}
