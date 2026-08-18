package com.expensetracker.repository;

import com.expensetracker.model.GroupBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupBudgetRepository extends JpaRepository<GroupBudget, UUID> {

    Optional<GroupBudget> findByGroupIdAndMonth(UUID groupId, LocalDate month);
}
