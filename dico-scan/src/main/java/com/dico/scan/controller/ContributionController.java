package com.dico.scan.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

/**
 * REST Controller for user-contributed product data (photos/OCR).
 * Triggered when a barcode scan returns 404 (product not in OFF or DB).
 *
 * MVP: Returns 202 Accepted. Actual GCS upload + OCR processing is Sprint 4
 * (async).
 * Phase 2+: Triggers Cloud Storage upload + background OCR job via Pub/Sub.
 */
@Slf4j
@RestController
@RequestMapping("/v1/contribute")
@Tag(name = "Contribute", description = "User-contributed product photos for missing barcodes")
public class ContributionController {

    @PostMapping
    @Operation(summary = "Upload a product image for missing barcode", description = "Accepts multipart image. Returns 202 Accepted immediately. Async OCR processing handled in background.")
    public ResponseEntity<Map<String, String>> contribute(
            @RequestParam("barcode") String barcode,
            @RequestPart("image") MultipartFile image) {
        // Validate basic constraints
        if (image.isEmpty()) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Image file is required"));
        }
        if (image.getSize() > 10 * 1024 * 1024) { // 10MB limit
            return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                    .body(Map.of("error", "Image size must be under 10MB"));
        }

        log.info("Contribution received: barcode={}, size={}KB", barcode, image.getSize() / 1024);

        // TODO Sprint 4: Upload to GCS bucket and trigger async OCR processing via
        // Pub/Sub
        // String gcsPath = gcsService.upload(barcode, image);
        // pubSubTemplate.publish("ocr-processing", Map.of("barcode", barcode,
        // "gcsPath", gcsPath));

        return ResponseEntity.accepted()
                .body(Map.of(
                        "status", "ACCEPTED",
                        "message", "Cảm ơn! Ảnh sẽ được xử lý để bổ sung thông tin sản phẩm.",
                        "barcode", barcode));
    }
}
