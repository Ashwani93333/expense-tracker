package com.expensetracker.repository;

import com.expensetracker.model.ExpenseSplit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExpenseSplitRepository extends JpaRepository<ExpenseSplit, UUID> {

    List<ExpenseSplit> findByExpenseId(UUID expenseId);

    Optional<ExpenseSplit> findByExpenseIdAndUserId(UUID expenseId, UUID userId);

    /** Sum of a member's share in a group for a given month (APPROVED expenses only) */
    @Query("SELECT COALESCE(SUM(es.shareAmount), 0) FROM ExpenseSplit es " +
           "JOIN es.expense e " +
           "WHERE es.user.id = :userId " +
           "AND e.group.id = :groupId " +
           "AND e.status = 'APPROVED' " +
           "AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumMemberShareInGroupForMonth(
            @Param("userId") UUID userId,
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** All splits for a group's expenses in a month (APPROVED only, for settlement calculation) */
    @Query("SELECT es FROM ExpenseSplit es JOIN es.expense e " +
           "WHERE e.group.id = :groupId " +
           "AND e.status = 'APPROVED' " +
           "AND e.expenseDate BETWEEN :start AND :end")
    List<ExpenseSplit> findByGroupAndMonth(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    void deleteByExpenseId(UUID expenseId);
}
