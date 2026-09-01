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

    List<Income> findByUserIdAndIncomeDateBetweenOrderByIncomeDateDesc(
            UUID userId, LocalDate startDate, LocalDate endDate);

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.incomeDate BETWEEN :start AND :end")
    BigDecimal sumIncomeForPeriod(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT COUNT(i) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.incomeDate BETWEEN :start AND :end")
    long countByUserIdAndIncomeDateBetween(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);

    @Query("SELECT i.source, SUM(i.amount) FROM Income i " +
           "WHERE i.user.id = :userId " +
           "AND i.incomeDate BETWEEN :start AND :end " +
           "GROUP BY i.source " +
           "ORDER BY SUM(i.amount) DESC")
    List<Object[]> sourceBreakdown(
            @Param("userId") UUID userId,
            @Param("start") LocalDate start,
            @Param("end") LocalDate end);
}
