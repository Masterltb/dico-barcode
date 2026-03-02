package com.dico.scan.external.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.List;

/**
 * Strict JSON response contract from Gemini AI (Spec 04, Section 3).
 * Backend deserializes AI response into this record — if any field is missing,
 * it throws
 * a JsonParseException which triggers the fallback in AiAnalysisService.
 */
@JsonIgnoreProperties(ignoreUnknown = false)
public record AiAnalysisResult(
        @JsonProperty("ai_summary") String aiSummary,
        @JsonProperty("detected_allergies") List<String> detectedAllergies,
        @JsonProperty("risk_ingredients") List<String> riskIngredients) {
}
