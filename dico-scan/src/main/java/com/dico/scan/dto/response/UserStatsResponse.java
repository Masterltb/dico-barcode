package com.dico.scan.dto.response;

/**
 * Aggregated scan statistics for GET /v1/users/me/stats.
 * All percentages as 0-100 int.
 */
public record UserStatsResponse(
        int totalScanned,
        int greenCount,
        int yellowCount,
        int redCount,
        int unknownCount,
        int greenPercent,
        int redPercent,

        /** Barcode of the most recently scanned product. Null if none. */
        String lastScannedBarcode,

        /** Day-of-week with most scans (0=Mon..6=Sun). -1 if not enough data. */
        int peakScanDayOfWeek,

        /**
         * Safety score summary: weighted average based on rating distribution.
         * 100 = all green, 0 = all red.
         */
        int safetyScore) {
}
