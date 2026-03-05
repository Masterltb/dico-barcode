package com.dico.scan.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * User favorite product record.
 * label: SAFE = "Mua lại" | AVOID = "Tránh mua"
 *
 * GUARDRAIL (Rule 2): UUID user_id directly — no @ManyToOne User.
 */
@Entity
@Table(name = "user_favorites", uniqueConstraints = @UniqueConstraint(name = "uq_user_barcode", columnNames = {
        "user_id", "barcode" }), indexes = {
                @Index(name = "idx_favorites_user_id", columnList = "user_id, added_at DESC"),
                @Index(name = "idx_favorites_barcode", columnList = "user_id, barcode")
        })
@Getter
@Setter
@NoArgsConstructor
public class UserFavorite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Column(name = "barcode", nullable = false, length = 14)
    private String barcode;

    /** SAFE = Mua lại | AVOID = Tránh mua */
    @Column(name = "label", nullable = false, length = 20)
    private String label = "SAFE";

    @Column(name = "note", columnDefinition = "TEXT")
    private String note;

    @Column(name = "added_at", nullable = false)
    private OffsetDateTime addedAt;

    @PrePersist
    protected void onCreate() {
        if (addedAt == null)
            addedAt = OffsetDateTime.now();
    }
}
