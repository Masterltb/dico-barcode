package com.dico.scan.controller;

import com.dico.scan.dto.response.ProductEvaluationResponse;
import com.dico.scan.service.ProductApplicationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * REST Controller for product barcode evaluation.
 * Maps to OpenAPI spec: GET /v1/products/{barcode}
 */
@Slf4j
@Validated
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Barcode scanning and product safety evaluation")
public class ProductController {

    private final ProductApplicationService productService;

    /**
     * Evaluates a product by barcode.
     * Returns GREEN/YELLOW/RED safety rating with deterministic score and optional
     * AI summary.
     *
     * The barcode header X-Trace-Id is forwarded to GlobalExceptionHandler for log
     * correlation.
     * User preferences header X-User-Preferences is a JSON-encoded map (for MVP
     * without auth).
     */
    @GetMapping("/{barcode}")
    @Operation(summary = "Evaluate product safety by barcode", description = "Fetches product from DB cache or OpenFoodFacts, calculates deterministic safety score, returns rating with optional AI summary.")
    public ResponseEntity<ProductEvaluationResponse> evaluateProduct(
            @PathVariable @Pattern(regexp = "^[0-9]{8,14}$", message = "Barcode must be 8-14 digits") String barcode,

            // MVP: User allergies passed as request param JSON until auth is implemented
            // Phase 2: Replace with JWT-derived user preferences
            @RequestParam(value = "allergies", required = false) String allergiesParam) {
        log.info("Product evaluation request: barcode={}", barcode);

        // Parse allergies query param (comma-separated, e.g. ?allergies=peanuts,gluten)
        Map<String, Object> preferences = Map.of(
                "allergies", allergiesParam != null
                        ? java.util.Arrays.asList(allergiesParam.split(","))
                        : java.util.Collections.emptyList());

        ProductEvaluationResponse response = productService.evaluateProduct(barcode, preferences);
        return ResponseEntity.ok(response);
    }
}
