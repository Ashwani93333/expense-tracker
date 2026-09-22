package com.expensetracker.model;

import com.expensetracker.model.converter.UuidListJsonConverter;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Per-user onboarding preferences: monthly income range, how the user primarily
 * spends (individual / group / both) and the categories in which they spend.
 * Exactly one row per user (enforced by a UNIQUE constraint on user_id).
 */
@Entity
@Table(name = "user_preferences", uniqueConstraints = {
        @UniqueConstraint(name = "uk_user_preferences_user", columnNames = "user_id")
})
public class UserPreferences {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "income_slab", length = 30)
    private String incomeSlab;

    @Column(name = "expense_preference", length = 20)
    private String expensePreference;

    /** Selected default category ids, stored as JSON array in TEXT. */
    @Convert(converter = UuidListJsonConverter.class)
    @Column(name = "selected_category_ids", columnDefinition = "TEXT")
    private List<UUID> selectedCategoryIds = List.of();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    public UserPreferences() {}

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getIncomeSlab() { return incomeSlab; }
    public void setIncomeSlab(String incomeSlab) { this.incomeSlab = incomeSlab; }
    public String getExpensePreference() { return expensePreference; }
    public void setExpensePreference(String expensePreference) { this.expensePreference = expensePreference; }
    public List<UUID> getSelectedCategoryIds() { return selectedCategoryIds; }
    public void setSelectedCategoryIds(List<UUID> selectedCategoryIds) {
        this.selectedCategoryIds = selectedCategoryIds != null ? selectedCategoryIds : List.of();
    }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}