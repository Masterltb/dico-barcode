package com.dico.scan.service.scoring;

import com.dico.scan.enums.RatingColor;

import java.util.List;

/**
 * Immutable result computed by ScoringEngineService.
 * This record is passed to the orchestrator and mapped to the
 * ProductEvaluationResponse.
 *
 * @param score           0-100. Null when rating = UNKNOWN (insufficient OFF
 *                        data).
 * @param ratingColor     Deterministic color: GREEN / YELLOW / RED / UNKNOWN.
 * @param confidenceScore 0.0-1.0. < 1.0 when critical OFF fields were missing.
 * @param overrideReasons Empty list when no overrides applied. Contains reason
 *                        strings for O1/O2.
 * @param wasOverridden   True if O1 (blacklist additive) or O2 (allergy)
 *                        override was applied.
 */
public record ScoringResult(
        Integer score,
        RatingColor ratingColor,
        float confidenceScore,
        List<String> overrideReasons,
        boolean wasOverridden) {
}
