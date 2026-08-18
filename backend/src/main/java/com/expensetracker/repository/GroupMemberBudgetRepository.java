package com.expensetracker.repository;

import com.expensetracker.model.GroupMemberBudget;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberBudgetRepository extends JpaRepository<GroupMemberBudget, UUID> {

    Optional<GroupMemberBudget> findByGroupIdAndUserIdAndMonth(UUID groupId, UUID userId, LocalDate month);

    List<GroupMemberBudget> findByGroupIdAndMonth(UUID groupId, LocalDate month);
}
