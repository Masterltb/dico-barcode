package com.dico.scan.repository;

import com.dico.scan.entity.ScanHistory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ScanHistoryRepository extends JpaRepository<ScanHistory, UUID> {

    /**
     * GUARDRAIL (Rule 3): Fetches a DTO Projection instead of the full entity
     * graph.
     * Avoids loading the full ScanHistory join with Product just for list views.
     * Composite index (user_id, scanned_at DESC) makes this O(log n).
     */
    @Query("""
            SELECT new com.dico.scan.dto.response.ScanHistoryItemResponse(
                s.id, s.barcode, s.scannedAt, s.snapshotColor
            )
            FROM ScanHistory s
            WHERE s.userId = :userId
            ORDER BY s.scannedAt DESC
            """)
    Page<com.dico.scan.dto.response.ScanHistoryItemResponse> findHistoryByUserId(
            @Param("userId") UUID userId, Pageable pageable);
}
