package com.expensetracker.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Prevents duplicate monthly summary deliveries.
 * One row per (user, month, notificationType) — enforced by a UNIQUE constraint.
 */
@Entity
@Table(name = "monthly_notification_logs", uniqueConstraints = {
        @UniqueConstraint(name = "uk_monthly_notification_log", columnNames = {"user_id", "month", "notification_type"})
})
public class MonthlyNotificationLog {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "\"month\"", nullable = false)
    private LocalDate month;

    @Column(name = "notification_type", nullable = false, length = 50)
    private String notificationType;

    @CreationTimestamp
    @Column(name = "sent_at", updatable = false)
    private OffsetDateTime sentAt;

    public MonthlyNotificationLog() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public LocalDate getMonth() { return month; }
    public void setMonth(LocalDate month) { this.month = month; }
    public String getNotificationType() { return notificationType; }
    public void setNotificationType(String notificationType) { this.notificationType = notificationType; }
    public OffsetDateTime getSentAt() { return sentAt; }
    public void setSentAt(OffsetDateTime sentAt) { this.sentAt = sentAt; }
}
