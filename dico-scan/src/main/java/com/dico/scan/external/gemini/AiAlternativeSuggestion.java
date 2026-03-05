package com.dico.scan.external.gemini;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;

/**
 * One AI-suggested product alternative from Gemini.
 *
 * Used exclusively in ProductAlternativeService — NOT part of the main
 * AiAnalysisResult flow. Gemini returns a JSON array of these.
 *
 * Note: name/brand are suggestions made by Gemini — they are NOT verified
 * barcodes. The mobile app labels these as "🤖 Gợi ý AI".
 */
@JsonIgnoreProperties(ignoreUnknown = true)
public record AiAlternativeSuggestion(
        @JsonProperty("name") String name,
        @JsonProperty("brand") String brand,
        @JsonProperty("reason") String reason,
        @JsonProperty("why_better") String whyBetter) {
}
