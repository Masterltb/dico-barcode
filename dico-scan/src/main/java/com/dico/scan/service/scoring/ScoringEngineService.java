package com.dico.scan.service.scoring;

import com.dico.scan.enums.AdditiveRisk;
import com.dico.scan.enums.RatingColor;
import com.dico.scan.external.off.OffProductData;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

/**
 * Deterministic Scoring Engine — the single source of truth for food safety
 * ratings.
 *
 * CRITICAL CONTRACT (from Spec 03 & memory.md):
 * - AI CANNOT override this service's output.
 * - This service is PURE JAVA — zero I/O, zero DB calls, zero @Autowired Spring
 * data repos.
 * - Must be 100% unit-testable without any Spring context.
 *
 * Formula: Final_Score = (N_Nutri * 0.4) + (N_Nova * 0.4) + (N_Additives * 0.2)
 * Color: GREEN >= 70 | YELLOW 40-69 | RED < 40
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ScoringEngineService {

    private final AdditiveRiskRegistry additiveRegistry;

    // ===== Score Deductions & Bounds =====
    private static final int MEDIUM_RISK_DEDUCTION = 15;
    private static final int N_ADDITIVES_MAX = 100;

    // ===== Color Thresholds (Spec 03, Section 2) =====
    private static final int GREEN_THRESHOLD = 70;
    private static final int YELLOW_THRESHOLD = 40;

    // ===== Override O2/O1 forced scores =====
    private static final int O1_MAX_SCORE = 39; // Blacklist additive
    private static final int O2_MAX_SCORE = 10; // Allergy conflict (most severe)

    /**
     * Computes the deterministic safety rating for a product against a user's
     * allergy profile.
     *
     * @param productData   Normalized product data from OpenFoodFacts.
     * @param userAllergies List of allergy identifiers (e.g. ["peanuts", "gluten"])
     * @return ScoringResult with final score, color, confidence, and override
     *         reasons.
     */
    public ScoringResult calculate(OffProductData productData, List<String> userAllergies) {
        List<String> overrideReasons = new ArrayList<>();

        // ============================
        // Step 1: Override O3 — Insufficient Data (Spec 03, Section 3.3)
        // If none of the 3 critical fields are available, return UNKNOWN.
        // ============================
        if (!productData.hasCompleteData()
                && productData.nutriscoreGrade().isEmpty()
                && productData.novaGroup() == null
                && productData.ingredientsText().isEmpty()) {
            log.debug("Override O3: Insufficient data for barcode {}", productData.barcode());
            return new ScoringResult(null, RatingColor.UNKNOWN, 0.3f,
                    List.of("Insufficient product data from OpenFoodFacts"), false);
        }

        // ============================
        // Step 2: Calculate N_Nutri (40% weight)
        // ============================
        double nNutri = mapNutriScore(productData.nutriscoreGrade());

        // ============================
        // Step 3: Calculate N_Nova (40% weight)
        // ============================
        double nNova = mapNovaGroup(productData.novaGroup());

        // ============================
        // Step 4: Calculate N_Additives (20% weight)
        // ============================
        double nAdditives = calculateNAdditives(productData.additivesTags(), overrideReasons);

        // ============================
        // Step 5: Weighted Final Score
        // ============================
        int rawScore = (int) Math.round(
                (nNutri * 0.4) + (nNova * 0.4) + (nAdditives * 0.2));
        rawScore = Math.max(0, Math.min(100, rawScore)); // Clamp to [0, 100]

        // ============================
        // Step 6: Override O1 — High-Risk Additive (Spec 03, Section 3.1)
        // Detected above during N_Additives calculation, overrideReasons already
        // populated.
        // ============================
        boolean hasHighRiskAdditive = overrideReasons.stream()
                .anyMatch(r -> r.startsWith("Blacklisted additive"));

        if (hasHighRiskAdditive) {
            rawScore = Math.min(rawScore, O1_MAX_SCORE);
        }

        // ============================
        // Step 7: Override O2 — Allergy Conflict (Spec 03, Section 3.2)
        // Most severe override: caps score at 10.
        // ============================
        boolean allergyConflict = detectAllergyConflict(
                productData.ingredientsText(),
                productData.allergensHierarchy(),
                userAllergies,
                overrideReasons);

        if (allergyConflict) {
            rawScore = Math.min(rawScore, O2_MAX_SCORE);
        }

        // ============================
        // Step 8: Map score to color
        // ============================
        RatingColor color = mapScoreToColor(rawScore, hasHighRiskAdditive || allergyConflict);

        // ============================
        // Step 9: Confidence score (how complete the OFF data was)
        // ============================
        float confidence = productData.hasCompleteData() ? 1.0f : 0.6f;

        log.debug("Score computed for {}: score={}, color={}, confidence={}, overrides={}",
                productData.barcode(), rawScore, color, confidence, overrideReasons.size());

        return new ScoringResult(rawScore, color, confidence, overrideReasons,
                hasHighRiskAdditive || allergyConflict);
    }

    // ===== N_Nutri Mapping (Spec 03, Section 1.1) =====
    private double mapNutriScore(String grade) {
        return switch (grade.toUpperCase()) {
            case "A" -> 100;
            case "B" -> 80;
            case "C" -> 60;
            case "D" -> 40;
            case "E" -> 20;
            default -> 50; // null or unknown → penalty midpoint
        };
    }

    // ===== N_Nova Mapping (Spec 03, Section 1.2) =====
    private double mapNovaGroup(Integer novaGroup) {
        if (novaGroup == null)
            return 50; // penalty midpoint
        return switch (novaGroup) {
            case 1 -> 100;
            case 2 -> 80;
            case 3 -> 50;
            case 4 -> 10;
            default -> 50;
        };
    }

    // ===== N_Additives Calculation (Spec 03, Section 1.3) =====
    private double calculateNAdditives(List<String> additivesTags, List<String> overrideReasons) {
        int score = N_ADDITIVES_MAX;
        for (String tag : additivesTags) {
            AdditiveRisk risk = additiveRegistry.classify(tag);
            switch (risk) {
                case HIGH ->
                    overrideReasons.add("Blacklisted additive detected: " + tag.replace("en:", "").toUpperCase());
                case MEDIUM -> score = Math.max(0, score - MEDIUM_RISK_DEDUCTION);
                default -> {
                } // LOW: no deduction
            }
        }
        return score;
    }

    // ===== Override O2: Allergy Conflict (Spec 03, Section 3.2) =====
    private boolean detectAllergyConflict(
            String ingredientsText,
            List<String> allergensHierarchy,
            List<String> userAllergies,
            List<String> overrideReasons) {
        if (userAllergies == null || userAllergies.isEmpty())
            return false;

        String lowerIngredients = ingredientsText.toLowerCase();
        boolean conflict = false;

        for (String allergy : userAllergies) {
            String lowerAllergy = allergy.toLowerCase();

            // Check 1: ingredients_text contains allergy keyword
            boolean inText = lowerIngredients.contains(lowerAllergy);

            // Check 2: allergens_hierarchy from OFF (more reliable)
            boolean inHierarchy = allergensHierarchy.stream()
                    .anyMatch(a -> a.toLowerCase().contains(lowerAllergy));

            if (inText || inHierarchy) {
                overrideReasons.add("Allergy conflict: " + allergy);
                conflict = true;
            }
        }
        return conflict;
    }

    // ===== Color Mapping (Spec 03, Section 2) =====
    private RatingColor mapScoreToColor(int score, boolean forceRed) {
        if (forceRed)
            return RatingColor.RED;
        if (score >= GREEN_THRESHOLD)
            return RatingColor.GREEN;
        if (score >= YELLOW_THRESHOLD)
            return RatingColor.YELLOW;
        return RatingColor.RED;
    }
}
