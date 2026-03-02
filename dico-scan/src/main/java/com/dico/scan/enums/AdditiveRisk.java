package com.dico.scan.enums;

/**
 * Risk classification for food additives.
 * Used by AdditiveRiskRegistry and ScoringEngineService.
 */
public enum AdditiveRisk {
    /**
     * Carcinogenic or banned additives (e.g. E171, E250).
     * Triggers Override O1 → forces RED rating regardless of score.
     */
    HIGH,

    /**
     * Controversial additives with noted health concerns (e.g. E102, E110).
     * Each medium-risk additive deducts 15 points from N_Additives.
     */
    MEDIUM,

    /**
     * Approved, well-tolerated additives (e.g. E300 = Vitamin C).
     * No score deduction.
     */
    LOW
}
