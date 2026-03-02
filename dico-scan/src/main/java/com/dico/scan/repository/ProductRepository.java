package com.dico.scan.repository;

import com.dico.scan.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;

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
}
