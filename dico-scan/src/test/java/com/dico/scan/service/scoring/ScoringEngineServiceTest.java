package com.dico.scan.service.scoring;

import com.dico.scan.enums.RatingColor;
import com.dico.scan.external.off.OffProductData;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Collections;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Unit tests for ScoringEngineService.
 * GUARDRAIL: No Spring context loaded — pure Java unit tests.
 * Target: 100% branch coverage of scoring formula and all 3 overrides.
 */
class ScoringEngineServiceTest {

    private ScoringEngineService scoringEngine;

    @BeforeEach
    void setUp() {
        // Pure Java instantiation — no Spring needed (proves zero I/O dependency)
        AdditiveRiskRegistry registry = new AdditiveRiskRegistry();
        scoringEngine = new ScoringEngineService(registry);
    }

    // ===========================
    // BASE FORMULA TESTS
    // ===========================

    @Test
    @DisplayName("Perfect product: NutriScore A + Nova 1 + No additives => GREEN, score=100")
    void perfectProduct_shouldBeGreen100() {
        OffProductData product = buildProduct("A", 1, List.of(), "water, oats", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.GREEN);
        assertThat(result.score()).isEqualTo(100);
        assertThat(result.wasOverridden()).isFalse();
        assertThat(result.overrideReasons()).isEmpty();
    }

    @Test
    @DisplayName("Terrible product: NutriScore E + Nova 4 + 3 medium risk additives => RED, score<40")
    void terribleProduct_shouldBeRed() {
        OffProductData product = buildProduct("E", 4, List.of("en:e102", "en:e110", "en:e211"),
                "sugar, palm oil, e102, e110", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.RED);
        assertThat(result.score()).isLessThan(40);
    }

    @Test
    @DisplayName("Mid-range product: NutriScore C + Nova 2 + no additives => YELLOW")
    void midRangeProduct_shouldBeYellow() {
        OffProductData product = buildProduct("C", 2, List.of(), "wheat, milk, sugar", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.YELLOW);
        assertThat(result.score()).isBetween(40, 69);
    }

    @Test
    @DisplayName("Null NutriScore + Null Nova => uses 50 point penalty midpoints")
    void missingNutriAndNova_shouldUsePenaltyMidpoints() {
        OffProductData product = buildProduct("", null, List.of(), "some ingredients", List.of(), false);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        // Score = (50 * 0.4) + (50 * 0.4) + (100 * 0.2) = 20 + 20 + 20 = 60 => YELLOW
        assertThat(result.ratingColor()).isEqualTo(RatingColor.YELLOW);
        assertThat(result.score()).isEqualTo(60);
    }

    // ===========================
    // OVERRIDE O1: Blacklisted Additive
    // ===========================

    @Test
    @DisplayName("O1: Product with E171 (Titanium Dioxide) must be forced to RED regardless of NutriScore A")
    void highRiskAdditive_E171_shouldForceRed() {
        // Even a NutriScore A product with E171 must be RED
        OffProductData product = buildProduct("A", 1, List.of("en:e171"),
                "water, titanium dioxide", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.RED);
        assertThat(result.score()).isLessThanOrEqualTo(39);
        assertThat(result.wasOverridden()).isTrue();
        assertThat(result.overrideReasons())
                .anyMatch(r -> r.contains("Blacklisted additive") && r.contains("E171"));
    }

    @Test
    @DisplayName("O1: Product with E250 (Sodium Nitrite) must be forced to RED")
    void highRiskAdditive_E250_shouldForceRed() {
        OffProductData product = buildProduct("B", 2, List.of("en:e250"),
                "pork, salt, sodium nitrite", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.RED);
        assertThat(result.wasOverridden()).isTrue();
    }

    // ===========================
    // OVERRIDE O2: Allergy Conflict
    // ===========================

    @Test
    @DisplayName("O2: Peanut-allergic user scanning peanut product => RED, score<=10")
    void allergyConflict_peanut_shouldForceRedAndScore10() {
        OffProductData product = buildProduct("B", 1, List.of(),
                "oats, peanuts, palm oil, chocolate", List.of("en:peanuts"), true);
        ScoringResult result = scoringEngine.calculate(product, List.of("peanuts"));

        assertThat(result.ratingColor()).isEqualTo(RatingColor.RED);
        assertThat(result.score()).isLessThanOrEqualTo(10);
        assertThat(result.wasOverridden()).isTrue();
        assertThat(result.overrideReasons())
                .anyMatch(r -> r.contains("Allergy conflict") && r.toLowerCase().contains("peanut"));
    }

    @Test
    @DisplayName("O2: No allergy match => no override applied")
    void noAllergyMatch_shouldNotOverride() {
        OffProductData product = buildProduct("B", 1, List.of(),
                "oats, water, sugar", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, List.of("peanuts"));

        assertThat(result.wasOverridden()).isFalse();
        assertThat(result.ratingColor()).isNotEqualTo(RatingColor.RED);
    }

    @Test
    @DisplayName("Empty user allergy list => no allergy override triggered even on peanut product")
    void emptyAllergyList_shouldNotTriggerO2() {
        OffProductData product = buildProduct("A", 1, List.of(),
                "peanuts, chocolate, sugar", List.of("en:peanuts"), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.wasOverridden()).isFalse();
    }

    // ===========================
    // OVERRIDE O3: Insufficient Data
    // ===========================

    @Test
    @DisplayName("O3: All critical fields null/empty => UNKNOWN rating, null score")
    void allCriticalFieldsMissing_shouldBeUnknown() {
        OffProductData product = buildProduct("", null, List.of(), "", List.of(), false);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.ratingColor()).isEqualTo(RatingColor.UNKNOWN);
        assertThat(result.score()).isNull();
        assertThat(result.overrideReasons())
                .anyMatch(r -> r.contains("Insufficient product data"));
    }

    // ===========================
    // MEDIUM RISK DEDUCTION
    // ===========================

    @Test
    @DisplayName("3 medium-risk additives (E102, E110, E211) should each deduct 15pts from N_Additives")
    void mediumRiskAdditives_shouldDeductPoints() {
        // NutriScore A (100) + Nova 1 (100) + 3 medium risk: 100 - 45 = 55
        // Final = (100*0.4) + (100*0.4) + (55*0.2) = 40 + 40 + 11 = 91 → GREEN
        OffProductData product = buildProduct("A", 1,
                List.of("en:e102", "en:e110", "en:e211"),
                "water, e102, e110, sodium benzoate", List.of(), true);
        ScoringResult result = scoringEngine.calculate(product, Collections.emptyList());

        assertThat(result.score()).isEqualTo(91);
        assertThat(result.ratingColor()).isEqualTo(RatingColor.GREEN);
    }

    // ===========================
    // HELPER
    // ===========================

    private OffProductData buildProduct(
            String nutriscoreGrade, Integer novaGroup, List<String> additivesTags,
            String ingredientsText, List<String> allergensHierarchy, boolean hasCompleteData) {
        return new OffProductData(
                "1234567890123", "Test Product", "Test Brand", "",
                nutriscoreGrade, novaGroup, additivesTags, ingredientsText, allergensHierarchy,
                200.0, 5.0, 1.0,
                hasCompleteData);
    }
}
