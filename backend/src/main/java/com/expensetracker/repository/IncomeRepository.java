package com.expensetracker.repository;

import com.expensetracker.model.Income;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Repository
public interface IncomeRepository extends JpaRepository<Income, UUID> {

    // ---- Personal income (group_id IS NULL) ----

    List<Income> findByUserIdAndGroupIsNullAndIncomeDateBetweenOrderByIncomeDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.group IS NULL " +
           "AND i.incomeDate BETWEEN :start AND :end")
    BigDecimal sumIncomeForPeriod(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COUNT(i) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.group IS NULL " +
           "AND i.incomeDate BETWEEN :start AND :end")
    long countByUserIdAndIncomeDateBetween(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT i.source, SUM(i.amount) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.group IS NULL " +
           "AND i.incomeDate BETWEEN :start AND :end " +
           "GROUP BY i.source " +
           "ORDER BY SUM(i.amount) DESC")
    List<Object[]> sourceBreakdown(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    // ---- Group income ----

    List<Income> findByGroupIdAndIncomeDateBetweenOrderByIncomeDateDesc(
            UUID groupId, LocalDate startDate, LocalDate endDate);

    List<Income> findByGroupIdAndUserIdAndIncomeDateBetweenOrderByIncomeDateDesc(
            UUID groupId, UUID userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i " +
           "WHERE i.group.id = :groupId " +
           "AND i.incomeDate BETWEEN :start AND :end")
    BigDecimal sumGroupIncomeForPeriod(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COUNT(i) FROM Income i " +
           "WHERE i.group.id = :groupId " +
           "AND i.incomeDate BETWEEN :start AND :end")
    long countByGroupIdAndIncomeDateBetween(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT i.source, SUM(i.amount) FROM Income i " +
           "WHERE i.group.id = :groupId " +
           "AND i.incomeDate BETWEEN :start AND :end " +
           "GROUP BY i.source " +
           "ORDER BY SUM(i.amount) DESC")
    List<Object[]> groupSourceBreakdown(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT i.user.id, i.user.fullName, SUM(i.amount), COUNT(i) FROM Income i " +
           "WHERE i.group.id = :groupId " +
           "AND i.incomeDate BETWEEN :start AND :end " +
           "GROUP BY i.user.id, i.user.fullName " +
           "ORDER BY SUM(i.amount) DESC")
    List<Object[]> groupMemberBreakdown(
            @Param("groupId") UUID groupId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
