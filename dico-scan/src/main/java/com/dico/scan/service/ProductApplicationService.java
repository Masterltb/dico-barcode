package com.dico.scan.service;

import com.dico.scan.dto.response.ProductEvaluationResponse;
import com.dico.scan.entity.Product;
import com.dico.scan.exception.ProductNotFoundException;
import com.dico.scan.external.gemini.AiAnalysisResult;
import com.dico.scan.external.gemini.GeminiClient;
import com.dico.scan.external.off.OffProductData;
import com.dico.scan.external.off.OpenFoodFactsClient;
import com.dico.scan.repository.ProductRepository;
import com.dico.scan.service.scoring.ScoringEngineService;
import com.dico.scan.service.scoring.ScoringResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.OffsetDateTime;
import java.util.*;

/**
 * Main orchestrator for the barcode evaluation flow (Sprint 2 + Sprint 3
 * integrated).
 *
 * THE 5-STEP PRODUCTION FLOW:
 * 1. DB Cache Check (fast path, closes connection immediately)
 * 2. OpenFoodFacts Fetch (network, NO open DB transaction)
 * 3. Deterministic Scoring (pure math, no I/O)
 * 4. Persist deterministic result (REQUIRES_NEW transaction, short-lived)
 * 5. AI Layer: SHA-256 cache check + Gemini (network, NO open DB transaction)
 * 6. Update AI summary in DB if needed (REQUIRES_NEW transaction, short-lived)
 * 7. Build and return response
 *
 * GUARDRAIL (Rule 6): NO @Transactional here.
 * DB connections are held only during Steps 1, 4, and 6 — never during network
 * calls (2, 5).
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductApplicationService {

    private final ProductRepository productRepository;
    private final OpenFoodFactsClient offClient;
    private final ScoringEngineService scoringEngine;
    private final ProductPersistService persistService;
    private final GeminiClient geminiClient;

    @Value("${app.product-cache.ttl-days:90}")
    private int cacheTtlDays;

    // ======================================================
    // MAIN ENTRY POINT
    // ======================================================

    public ProductEvaluationResponse evaluateProduct(String barcode, Map<String, Object> preferences) {
        List<String> userAllergies = extractAllergies(preferences);

        // -------- Step 1: DB Cache Check --------
        Product cached = productRepository.findById(barcode).orElse(null);
        if (cached != null && isFresh(cached)) {
            log.debug("Cache HIT for barcode={}", barcode);
            return toResponse(cached, Collections.emptyList());
        }
        log.debug("Cache MISS for barcode={}", barcode);

        // -------- Step 2: Fetch OpenFoodFacts (network - no DB transaction open)
        // --------
        OffProductData offData = offClient.fetchProduct(barcode)
                .orElseThrow(() -> new ProductNotFoundException(barcode));

        // -------- Step 3: Deterministic Scoring (pure math) --------
        ScoringResult result = scoringEngine.calculate(offData, userAllergies);

        // -------- Step 4: Persist scoring result (opens short REQUIRES_NEW
        // transaction) --------
        Product saved = persistService.saveProduct(barcode, offData, result);

        // -------- Step 5: AI Layer (network - no DB transaction open) --------
        String aiInputsHash = computeAiHash(offData, userAllergies);
        String aiSummary = null;

        // 5a: AI Cache check — if ingredients unchanged, reuse stored summary
        if (saved.getAiInputsHash() != null && saved.getAiInputsHash().equals(aiInputsHash)
                && saved.getAiSummaryCache() != null && !saved.getAiSummaryCache().contains("Vui lòng thử lại sau")) {
            log.debug("AI Cache HIT for barcode={}", barcode);
            aiSummary = saved.getAiSummaryCache();
        } else {
            // 5b: AI Cache MISS — call Gemini (with internal 2s timeout + fallback)
            AiAnalysisResult aiResult = geminiClient.analyze(offData, userAllergies);
            aiSummary = aiResult.aiSummary();

            // -------- Step 6: Update AI summary in DB (REQUIRES_NEW transaction) --------
            persistService.updateAiSummary(barcode, aiSummary, aiInputsHash);
        }

        // -------- Step 7: Build final response --------
        saved.setAiSummaryCache(aiSummary); // in-memory only, already persisted above
        return toResponse(saved, result.overrideReasons());
    }

    // ======================================================
    // PRIVATE HELPERS
    // ======================================================

    private boolean isFresh(Product product) {
        if (product.getUpdatedAt() == null)
            return false;
        if (product.getAiSummaryCache() != null && product.getAiSummaryCache().contains("Vui lòng thử lại sau"))
            return false;
        return product.getUpdatedAt().isAfter(OffsetDateTime.now().minusDays(cacheTtlDays));
    }

    /**
     * Computes SHA-256 of key AI input fields.
     * If this hash matches what's stored in the DB, we skip calling Gemini.
     */
    private String computeAiHash(OffProductData data, List<String> allergies) {
        String input = data.ingredientsText()
                + "|" + data.sugars100g()
                + "|" + data.salt100g()
                + "|" + String.join(",", allergies);
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            StringBuilder hex = new StringBuilder();
            for (byte b : hash)
                hex.append(String.format("%02x", b));
            return hex.toString();
        } catch (Exception ex) {
            log.error("SHA-256 hash failed", ex);
            return UUID.randomUUID().toString(); // fallback — forces fresh AI call
        }
    }

    private List<String> extractAllergies(Map<String, Object> preferences) {
        if (preferences == null)
            return Collections.emptyList();
        Object allergies = preferences.get("allergies");
        if (allergies instanceof List<?> list) {
            return list.stream()
                    .filter(e -> e instanceof String)
                    .map(e -> ((String) e).toLowerCase())
                    .toList();
        }
        return Collections.emptyList();
    }

    private ProductEvaluationResponse toResponse(Product p, List<String> overrideReasons) {
        return new ProductEvaluationResponse(
                p.getBarcode(),
                p.getName(),
                p.getBrand(),
                p.getImageUrl(),
                p.getRatingColor(),
                p.getDeterminScore() != null ? p.getDeterminScore().intValue() : null,
                p.getConfidenceScore(),
                p.getAiSummaryCache(),
                overrideReasons == null || overrideReasons.isEmpty() ? null : overrideReasons,
                p.getUpdatedAt());
    }
}
