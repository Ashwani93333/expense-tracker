package com.expensetracker.repository;

import com.expensetracker.model.ExpenseGroup;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseGroupRepository extends JpaRepository<ExpenseGroup, UUID> {

    Optional<ExpenseGroup> findByInviteCode(String inviteCode);

    @Query("SELECT g FROM ExpenseGroup g JOIN GroupMember gm ON gm.group = g " +
           "WHERE gm.user.id = :userId AND gm.status = 'ACTIVE' AND g.isActive = true")
    List<ExpenseGroup> findGroupsByUserId(@Param("userId") UUID userId);
}
