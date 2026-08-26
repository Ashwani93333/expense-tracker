package com.expensetracker.repository;

import com.expensetracker.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, UUID> {

    /** Personal expenses for a given month */
    List<Expense> findByUserIdAndGroupIsNullAndExpenseDateBetweenOrderByExpenseDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    /** Group expenses for a given month */
    List<Expense> findByGroupIdAndExpenseDateBetweenOrderByExpenseDateDesc(
            UUID groupId, LocalDate startDate, LocalDate endDate);

    /** Group expenses for a given month filtered by approval status */
    List<Expense> findByGroupIdAndStatusAndExpenseDateBetweenOrderByExpenseDateDesc(
            UUID groupId, String status, LocalDate startDate, LocalDate endDate);

    /** Sum of personal expenses in a month (non-group) */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.group IS NULL " +
           "AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumPersonalExpensesForMonth(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Number of personal expenses in a month (non-group) */
    @Query("SELECT COUNT(e) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.group IS NULL " +
           "AND e.expenseDate BETWEEN :start AND :end")
    long countPersonalExpensesForMonth(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Top N personal expenses for a month by amount, for the monthly summary. */
    @Query("SELECT e FROM Expense e " +
           "WHERE e.user.id = :userId AND e.group IS NULL " +
           "AND e.expenseDate BETWEEN :start AND :end " +
           "ORDER BY e.amount DESC")
    List<Expense> findTopPersonalExpensesForMonth(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end,
            org.springframework.data.domain.Pageable pageable);

    /** Sum of personal expenses by category in a month */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.group IS NULL " +
           "AND e.category.id = :categoryId " +
           "AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumPersonalExpensesByCategoryForMonth(
            @Param("userId") UUID userId,
            @Param("categoryId") UUID categoryId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Sum of APPROVED group expenses in a month — pending/rejected payments don't count */
    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e " +
           "WHERE e.group.id = :groupId " +
           "AND e.status = 'APPROVED' " +
           "AND e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumGroupExpensesForMonth(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Category breakdown for personal expenses in a month */
    @Query("SELECT e.category.id, e.category.name, SUM(e.amount) FROM Expense e " +
           "WHERE e.user.id = :userId AND e.group IS NULL " +
           "AND e.expenseDate BETWEEN :start AND :end " +
           "GROUP BY e.category.id, e.category.name")
    List<Object[]> categoryBreakdownPersonal(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** All expenses for a user: personal + group (where user is an active member) */
    @Query("SELECT e FROM Expense e " +
           "WHERE e.expenseDate BETWEEN :start AND :end " +
           "AND ( " +
           "  (e.user.id = :userId AND e.group IS NULL) " +
           "  OR e.group.id IN (" +
           "    SELECT gm.group.id FROM GroupMember gm " +
           "    WHERE gm.user.id = :userId AND gm.status = 'ACTIVE'" +
           "  )" +
           ") " +
           "ORDER BY e.expenseDate DESC")
    List<Expense> findAllUserExpensesForMonth(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Category breakdown for APPROVED group expenses in a month */
    @Query("SELECT e.category.id, e.category.name, SUM(e.amount) FROM Expense e " +
           "WHERE e.group.id = :groupId " +
           "AND e.status = 'APPROVED' " +
           "AND e.expenseDate BETWEEN :start AND :end " +
           "GROUP BY e.category.id, e.category.name")
    List<Object[]> categoryBreakdownGroup(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    /** Check if an expense with the same receipt hash already exists for this user. */
    boolean existsByUserIdAndReceiptHash(UUID userId, String receiptHash);
}
