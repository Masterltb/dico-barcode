package com.dico.scan.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

/**
 * Cached product record from OpenFoodFacts + computed Deterministic Score.
 * The off_payload JSONB stores the raw OFF API response for complete
 * traceability.
 *
 * Cache invalidation: products with updated_at older than 90 days are
 * considered stale.
 */
@Entity
@Table(name = "products", indexes = {
        @Index(name = "idx_products_updated", columnList = "updated_at DESC"),
        @Index(name = "idx_products_ai_hash", columnList = "ai_inputs_hash")
})
@Getter
@Setter
@NoArgsConstructor
public class Product {

    /** EAN-8 to EAN-14 barcode */
    @Id
    @Column(name = "barcode", length = 14, updatable = false)
    private String barcode;

    @Column(name = "name", length = 255)
    private String name;

    @Column(name = "brand", length = 255)
    private String brand;

    @Column(name = "image_url", columnDefinition = "TEXT")
    private String imageUrl;

    /**
     * Full raw payload from OpenFoodFacts. Stored as JSONB for future use without
     * re-fetching.
     */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "off_payload", columnDefinition = "jsonb")
    private com.dico.scan.external.off.OffProductData offPayload;

    /**
     * Computed score by ScoringEngineService. Range: 0-100. May be null if rating =
     * UNKNOWN.
     */
    @Column(name = "determin_score")
    private Short determinScore;

    /**
     * GREEN / YELLOW / RED / UNKNOWN — DB CHECK constraint enforces valid values.
     */
    @Column(name = "rating_color", length = 10)
    private String ratingColor;

    /**
     * 0.0 to 1.0. Below 1.0 means some OFF fields were missing.
     * Mobile app should show a disclaimer when confidence_score < 0.7.
     */
    @Column(name = "confidence_score", nullable = false)
    private Float confidenceScore = 1.0f;

    /**
     * Cached AI summary text (<50 words). Null = AI has not run yet or timed out.
     */
    @Column(name = "ai_summary_cache", columnDefinition = "TEXT")
    private String aiSummaryCache;

    /**
     * SHA-256 of AI input fields. Used to skip re-calling Gemini if ingredients
     * unchanged.
     */
    @Column(name = "ai_inputs_hash", length = 64)
    private String aiInputsHash;

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
