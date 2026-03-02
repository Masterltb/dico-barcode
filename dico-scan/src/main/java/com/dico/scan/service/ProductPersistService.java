package com.dico.scan.service;

import com.dico.scan.entity.Product;
import com.dico.scan.enums.ProductCategory;
import com.dico.scan.external.off.OffProductData;
import com.dico.scan.repository.ProductRepository;
import com.dico.scan.service.scoring.ScoringResult;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * Handles only the DB persistence step for products.
 * Deliberately split from ProductApplicationService to allow
 * 
 * @Transactional(REQUIRES_NEW) without affecting the outer transaction scope.
 *
 *                              GUARDRAIL (Rule 6): The outer
 *                              ProductApplicationService method is
 *                              NON-@Transactional.
 *                              Only this inner service opens a DB connection,
 *                              and only for the time needed to SAVE.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ProductPersistService {

    private final ProductRepository productRepository;

    /**
     * Saves or updates a product with its computed scoring result.
     * Uses REQUIRES_NEW to ensure this is a fresh, short-lived DB transaction
     * that does not interfere with any calling transaction context.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public Product saveProduct(String barcode, OffProductData offData, ScoringResult result, ProductCategory category) {
        Product product = productRepository.findById(barcode).orElse(new Product());

        product.setBarcode(barcode);
        product.setName(offData.productName());
        product.setBrand(offData.brand());
        product.setImageUrl(offData.imageUrl());
        product.setOffPayload(offData);
        product.setDeterminScore(result.score() != null ? result.score().shortValue() : null);
        product.setRatingColor(result.ratingColor().name());
        product.setConfidenceScore(result.confidenceScore());
        product.setCategory(category.name());
        product.setAiSummaryCache(null);
        product.setAiInputsHash(null);

        Product saved = productRepository.save(product);
        log.info("Product persisted: barcode={}, color={}, score={}", barcode, result.ratingColor(), result.score());
        return saved;
    }

    /**
     * Updates only the AI summary fields. Called after successful Gemini response.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateAiSummary(String barcode, String aiSummary, String aiInputsHash) {
        Product product = productRepository.findById(barcode)
                .orElseThrow(() -> new IllegalStateException("Product vanished before AI update: " + barcode));
        product.setAiSummaryCache(aiSummary);
        product.setAiInputsHash(aiInputsHash);
        productRepository.save(product);
        log.debug("AI summary updated for barcode={}", barcode);
    }
}
