package com.dico.scan.service.scoring;

import com.dico.scan.enums.AdditiveRisk;
import org.springframework.stereotype.Component;

import java.util.Set;

/**
 * Static registry of food additive risk classifications.
 *
 * HIGH: Carcinogenic / banned additives — triggers Override O1 → forces RED
 * rating.
 * MEDIUM: Controversial additives with documented health concerns — each
 * deducts 15pts from N_Additives.
 * LOW: Generally recognized as safe — no score impact.
 *
 * Additive tags from OpenFoodFacts use the format: "en:e171"
 * This registry maps normalized lowercase e-numbers (e.g. "e171") to risk
 * levels.
 */
@Component
public class AdditiveRiskRegistry {

    /**
     * HIGH RISK — O1 Override triggers RED regardless of nutritional score.
     * Sources: EFSA reassessments, WHO IARC classifications.
     */
    private static final Set<String> HIGH_RISK = Set.of(
            "e171", // Titanium Dioxide — EFSA: possible carcinogen
            "e250", // Sodium Nitrite — Processed meat carcinogen
            "e249", // Potassium Nitrite
            "e251", // Sodium Nitrate
            "e252", // Potassium Nitrate
            "e951", // Aspartame — controversial neurotoxin concerns
            "e954", // Saccharin — bladder cancer concerns in high dose
            "e966", // Lactitol — causes severe GI issues at scale
            "e150d" // Sulfite ammonia caramel — contains 4-MEI (carcinogen)
    );

    /**
     * MEDIUM RISK — Each occurrence deducts 15 pts from N_Additives.
     * Sources: CSPI, EWG, EU watchlist additives.
     */
    private static final Set<String> MEDIUM_RISK = Set.of(
            "e102", // Tartrazine — linked to ADHD in children
            "e104", // Quinoline Yellow — EU restricted
            "e110", // Sunset Yellow — hyperactivity potential
            "e122", // Carmoisine
            "e124", // Ponceau 4R
            "e129", // Allura Red AC — hyperactivity
            "e211", // Sodium Benzoate — forms benzene with Vitamin C
            "e621", // MSG — sensitivity in some individuals
            "e627", // Disodium guanylate
            "e631", // Disodium inosinate
            "e320", // BHA — possible carcinogen
            "e321" // BHT — possible carcinogen
    );

    /**
     * Classify an OFF additive tag to its risk level.
     *
     * @param additiveTag e.g. "en:e171" or "e171"
     * @return AdditiveRisk level
     */
    public AdditiveRisk classify(String additiveTag) {
        if (additiveTag == null)
            return AdditiveRisk.LOW;

        // Normalize: strip "en:" prefix and lowercase
        String normalized = additiveTag.toLowerCase()
                .replace("en:", "")
                .trim();

        if (HIGH_RISK.contains(normalized))
            return AdditiveRisk.HIGH;
        if (MEDIUM_RISK.contains(normalized))
            return AdditiveRisk.MEDIUM;
        return AdditiveRisk.LOW;
    }

    public boolean isHighRisk(String additiveTag) {
        return classify(additiveTag) == AdditiveRisk.HIGH;
    }
}
