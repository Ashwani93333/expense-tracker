package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "group_invites")
public class GroupInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "group_id", nullable = false)
    private ExpenseGroup group;

    @Column(name = "invited_email", length = 255)
    private String invitedEmail;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invited_by", nullable = false)
    private User invitedBy;

    /** PENDING, ACCEPTED, EXPIRED, REVOKED */
    @Column(name = "status", nullable = false, length = 20)
    private String status = "PENDING";

    @Column(name = "token", unique = true, nullable = false, length = 64)
    private String token;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    /** PENDING | SENT | FAILED — SMTP delivery tracking for the invite email. */
    @Column(name = "email_status", length = 20)
    private String emailStatus;

    @Column(name = "email_sent_at")
    private OffsetDateTime emailSentAt;

    @Column(name = "email_failure_reason", columnDefinition = "TEXT")
    private String emailFailureReason;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    public GroupInvite() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public ExpenseGroup getGroup() { return group; }
    public void setGroup(ExpenseGroup group) { this.group = group; }
    public String getInvitedEmail() { return invitedEmail; }
    public void setInvitedEmail(String invitedEmail) { this.invitedEmail = invitedEmail; }
    public User getInvitedBy() { return invitedBy; }
    public void setInvitedBy(User invitedBy) { this.invitedBy = invitedBy; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }
    public OffsetDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(OffsetDateTime expiresAt) { this.expiresAt = expiresAt; }
    public String getEmailStatus() { return emailStatus; }
    public void setEmailStatus(String emailStatus) { this.emailStatus = emailStatus; }
    public OffsetDateTime getEmailSentAt() { return emailSentAt; }
    public void setEmailSentAt(OffsetDateTime emailSentAt) { this.emailSentAt = emailSentAt; }
    public String getEmailFailureReason() { return emailFailureReason; }
    public void setEmailFailureReason(String emailFailureReason) { this.emailFailureReason = emailFailureReason; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
