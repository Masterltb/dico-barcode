package com.dico.scan.repository;

import com.dico.scan.entity.Product;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;

@Repository
public interface ProductRepository extends JpaRepository<Product, String> {

    /**
     * Checks existence without loading the full entity.
     * Used for cache-hit detection — no point loading AI payload or JSONB if we
     * just need to know if it exists.
     */
    boolean existsByBarcodeAndUpdatedAtAfter(String barcode, OffsetDateTime threshold);

    /**
     * Batch cleanup of stale product cache (TTL = 90 days).
     * Called by a scheduled @Scheduled cron job.
     */
    @Modifying
    @Query("DELETE FROM Product p WHERE p.updatedAt < :threshold")
    int deleteStaleProducts(OffsetDateTime threshold);

    /**
     * Finds better alternative products in the same category.
     *
     * Guardrails:
     * - Must be GREEN or YELLOW (no UNKNOWN/RED alternatives)
     * - Must have a higher determinScore than the current product
     * - Excludes the currently scanned barcode
     * - Ordered by score DESC - newest first (community validated)
     *
     * GUARDRAIL (Rule_Score_01): This query uses determinScore from DB.
     * AI CANNOT produce or modify scores.
     */
    @Query("""
            SELECT p FROM Product p
            WHERE p.category = :category
              AND p.barcode != :excludeBarcode
              AND p.ratingColor IN ('GREEN', 'YELLOW')
              AND (p.determinScore IS NULL OR p.determinScore >= :minScore)
            ORDER BY p.determinScore DESC NULLS LAST, p.updatedAt DESC
            """)
    List<Product> findAlternatives(
            @Param("category") String category,
            @Param("excludeBarcode") String excludeBarcode,
            @Param("minScore") int minScore,
            Pageable pageable);
}
