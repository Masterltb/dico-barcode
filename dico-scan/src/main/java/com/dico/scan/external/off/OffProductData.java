package com.dico.scan.external.off;

import java.util.List;

/**
 * Normalized, null-safe representation of relevant OpenFoodFacts API fields.
 * Created by OffResponseParser after scraping the raw JSON payload.
 *
 * All fields are guaranteed non-null (empty string / 0 / empty list as
 * defaults).
 */
public record OffProductData(
                String barcode,
                String productName,
                String brand,
                String imageUrl,

                /** Nutriscore grade: A/B/C/D/E or empty string if missing */
                String nutriscoreGrade,

                /** NOVA group: 1/2/3/4 or null if missing */
                Integer novaGroup,

                /** List of additive tags e.g. ["en:e102", "en:e300"] */
                List<String> additivesTags,

                /** Raw ingredient text — sent to AI. May be empty. */
                String ingredientsText,

                /** Allergen hierarchy from OFF e.g. ["en:gluten", "en:peanuts"] */
                List<String> allergensHierarchy,

                /** Nutritional values per 100g */
                double energyKcal100g,
                double sugars100g,
                double salt100g,

                /** True if all critical fields are present (affects confidenceScore) */
                boolean hasCompleteData,

                /**
                 * Category tags from OFF e.g. ["en:chocolates", "en:snacks"] — used for
                 * ProductCategoryDetector
                 */
                List<String> categoriesTags) {
}
