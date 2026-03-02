package com.dico.scan.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.dico.scan.enums.SubscriptionTier;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

/**
 * Represents an authenticated user.
 *
 * GUARDRAIL: NO @OneToMany collections here.
 * ScanHistory is queried via ScanHistoryRepository.findByUserId(), never
 * lazy-loaded here.
 */
@Entity
@Table(name = "users", indexes = {
        @Index(name = "idx_users_email", columnList = "email")
})
@Getter
@Setter
@NoArgsConstructor
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "email", nullable = false, unique = true, length = 255)
    private String email;

    @Column(name = "display_name", length = 100)
    private String displayName;

    /**
     * JSONB column storing user dietary preferences.
     * Expected structure: {"allergies": ["peanuts", "gluten"], "diet": "vegan"}
     * GIN index on this column is created via Flyway migration for fast allergy
     * checks.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "preferences", columnDefinition = "jsonb")
    private Map<String, Object> preferences;

    /**
     * Subscription tier. FREE users get generic scans.
     * PREMIUM users get personalized allergy/profile-based analysis.
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "subscription_tier", nullable = false, length = 20)
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    /**
     * Extended personal profile for Premium users.
     * Schema: {"children_ages": [4, 7], "skin_type": "sensitive"}
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "profile_data", columnDefinition = "jsonb")
    private Map<String, Object> profileData;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now();
        updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
