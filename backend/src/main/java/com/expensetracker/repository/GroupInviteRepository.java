package com.expensetracker.repository;

import com.expensetracker.model.GroupInvite;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface GroupInviteRepository extends JpaRepository<GroupInvite, UUID> {

    Optional<GroupInvite> findByToken(String token);

    Optional<GroupInvite> findByGroupIdAndInvitedEmailAndStatus(UUID groupId, String invitedEmail, String status);

    /**
     * Resolves an invite by its stored value. New invites store a SHA-256 hash of
     * the raw token; legacy invites stored the raw token itself. Querying for both
     * keeps old invite links working after the security upgrade.
     */
    @Query("SELECT i FROM GroupInvite i WHERE i.token = :hashed OR i.token = :raw")
    Optional<GroupInvite> findByTokenOrRaw(@Param("hashed") String hashed, @Param("raw") String raw);

    Optional<GroupInvite> findByIdAndGroupId(UUID id, UUID groupId);
}
