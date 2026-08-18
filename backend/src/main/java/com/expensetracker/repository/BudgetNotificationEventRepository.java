package com.expensetracker.repository;

import com.expensetracker.model.BudgetNotificationEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface BudgetNotificationEventRepository extends JpaRepository<BudgetNotificationEvent, UUID> {

    boolean existsByDedupKey(String dedupKey);
}
