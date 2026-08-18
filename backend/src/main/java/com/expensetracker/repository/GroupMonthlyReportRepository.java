package com.expensetracker.repository;

import com.expensetracker.model.GroupMonthlyReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMonthlyReportRepository extends JpaRepository<GroupMonthlyReport, UUID> {

    Optional<GroupMonthlyReport> findByGroupIdAndMonth(UUID groupId, LocalDate month);
}
