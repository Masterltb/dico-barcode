package com.dico.scan.service;

import com.dico.scan.dto.response.UserStatsResponse;
import com.dico.scan.repository.ScanHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Aggregates scan history data into a statistics summary.
 *
 * GUARDRAIL (Rule 3): readOnly transaction + DTO projection queries — no full
 * entity load.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class UserStatsService {

    private final ScanHistoryRepository scanHistoryRepository;

    @Transactional(readOnly = true)
    public UserStatsResponse getStats(UUID userId) {
        long total = scanHistoryRepository.countByUserId(userId);

        if (total == 0) {
            return new UserStatsResponse(0, 0, 0, 0, 0, 0, 0, null, -1, 0);
        }

        // Color distribution
        List<Object[]> colorCounts = scanHistoryRepository.countByColorForUser(userId);
        int green = 0, yellow = 0, red = 0, unknown = 0;

        for (Object[] row : colorCounts) {
            String color = (String) row[0];
            int count = ((Number) row[1]).intValue();
            switch (color) {
                case "GREEN" -> green = count;
                case "YELLOW" -> yellow = count;
                case "RED" -> red = count;
                default -> unknown = count;
            }
        }

        // Percentages (rounded, can sum to 101 due to rounding — acceptable)
        int greenPct = (int) Math.round(green * 100.0 / total);
        int redPct = (int) Math.round(red * 100.0 / total);

        // Safety score: GREEN=100pts, YELLOW=60pts, RED=10pts, UNKNOWN=50pts
        int safetyScore = total > 0
                ? (int) Math.round((green * 100.0 + yellow * 60.0 + red * 10.0 + unknown * 50.0) / total)
                : 0;

        String lastBarcode = scanHistoryRepository.findLastScannedBarcode(userId);

        log.debug("Stats for userId={}: total={}, green={}, yellow={}, red={}, safety={}",
                userId, total, green, yellow, red, safetyScore);

        return new UserStatsResponse(
                (int) total, green, yellow, red, unknown,
                greenPct, redPct,
                lastBarcode,
                -1, // peakScanDayOfWeek: requires JPQL EXTRACT, not cross-DB portable — skip for
                    // now
                safetyScore);
    }
}
