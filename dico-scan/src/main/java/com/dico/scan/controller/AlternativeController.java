package com.dico.scan.controller;

import com.dico.scan.dto.response.AlternativeProductResponse;
import com.dico.scan.service.ProductAlternativeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * GET /v1/products/{barcode}/alternatives
 *
 * Public endpoint — no auth required.
 * If X-User-Id is present → PREMIUM allergy-filtered recommendations.
 * If anonymous → generic category recommendations.
 *
 * GUARDRAIL: Rating/Score data in responses comes EXCLUSIVELY from DB.
 * AI only provides name/brand/reason text.
 */
@Slf4j
@RestController
@RequestMapping("/v1/products")
@RequiredArgsConstructor
@Tag(name = "Products", description = "Product evaluation and alternatives")
public class AlternativeController {

    private final ProductAlternativeService alternativeService;

    @GetMapping("/{barcode}/alternatives")
    @Operation(summary = "Gợi ý sản phẩm thay thế tốt hơn", description = """
            Trả về danh sách sản phẩm thay thế phù hợp hơn cùng ngành hàng (FOOD/BEAUTY/TOY/FASHION).

            Nguồn dữ liệu (ưu tiên theo thứ tự):
            1. DB Community — sản phẩm đã được cộng đồng quét, có rating thực từ hệ thống.
            2. Gemini AI — gợi ý tên/thương hiệu khi DB chưa có đủ alternatives.

            PREMIUM users (X-User-Id header): tự động lọc theo hồ sơ dị ứng cá nhân.
            FREE/Anonymous: gợi ý chung theo ngành hàng.
            """)
    public ResponseEntity<List<AlternativeProductResponse>> getAlternatives(
            @PathVariable String barcode,
            @Parameter(description = "UUID người dùng — optional, dùng để filter theo dị ứng PREMIUM") @RequestHeader(value = "X-User-Id", required = false) UUID userId,
            @Parameter(description = "Số lượng gợi ý tối đa (1-5)") @RequestParam(defaultValue = "5") int limit) {

        int safeLimit = Math.min(Math.max(limit, 1), 5);
        log.info("Alternatives request: barcode={} userId={} limit={}", barcode,
                userId != null ? "present" : "anonymous", safeLimit);

        List<AlternativeProductResponse> alternatives = alternativeService.getAlternatives(barcode, userId, safeLimit);
        return ResponseEntity.ok(alternatives);
    }
}
