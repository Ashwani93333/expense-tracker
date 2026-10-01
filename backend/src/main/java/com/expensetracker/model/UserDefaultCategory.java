package com.expensetracker.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Marks a category as one of a user's default categories.
 *
 * <p>Written whenever the preferences form is saved. This is the authoritative
 * record of the onboarding selection — {@code user_preferences.selected_category_ids}
 * remains the raw form payload, but this table is what the rest of the app reads
 * so the selection survives as first-class database state and can be joined and
 * indexed.
 */
@Entity
@Table(name = "user_default_categories", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_default_categories", columnNames = {"user_id", "category_id"})
})
public class UserDefaultCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id")
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @Column(name = "created_at")
    private OffsetDateTime createdAt = OffsetDateTime.now();

    public UserDefaultCategory() {}

    public static UserDefaultCategory of(User user, Category category) {
        UserDefaultCategory link = new UserDefaultCategory();
        link.setUser(user);
        link.setCategory(category);
        return link;
    }

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
