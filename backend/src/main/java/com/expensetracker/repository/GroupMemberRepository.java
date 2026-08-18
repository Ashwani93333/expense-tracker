package com.expensetracker.repository;

import com.expensetracker.model.GroupMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupMemberRepository extends JpaRepository<GroupMember, UUID> {

    Optional<GroupMember> findByGroupIdAndUserId(UUID groupId, UUID userId);

    List<GroupMember> findByGroupIdAndStatus(UUID groupId, String status);

    List<GroupMember> findByUserIdAndStatus(UUID userId, String status);

    boolean existsByGroupIdAndUserIdAndStatus(UUID groupId, UUID userId, String status);

    long countByGroupIdAndStatus(UUID groupId, String status);
}
