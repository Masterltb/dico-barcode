package com.dico.scan.service;

import com.dico.scan.enums.ProductCategory;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Detects product category from OpenFoodFacts categories_tags list.
 * Routing logic determines which scoring engine and AI prompt to apply.
 *
 * Priority order: TOY > BEAUTY > FASHION > FOOD > GENERAL
 * (More specific categories win over general ones.)
 */
@Slf4j
@Service
public class ProductCategoryDetector {

    private static final List<String> TOY_KEYWORDS = List.of(
            "toy", "toys", "game", "games", "lego", "puzzle", "doll",
            "building-set", "action-figure", "board-game", "play");

    private static final List<String> BEAUTY_KEYWORDS = List.of(
            "cosmetic", "cosmetics", "skincare", "skin-care", "shampoo",
            "conditioner", "cream", "lotion", "serum", "makeup", "lipstick",
            "foundation", "sunscreen", "perfume", "haircare", "toothpaste",
            "body-wash", "shower-gel");

    private static final List<String> FASHION_KEYWORDS = List.of(
            "clothing", "cloth", "clothes", "textile", "textiles",
            "fashion", "apparel", "fabric", "garment", "shirt", "pants",
            "dress", "shoes", "accessories");

    private static final List<String> FOOD_KEYWORDS = List.of(
            "food", "foods", "beverage", "beverages", "snack", "snacks",
            "dairy", "meat", "cereal", "cereals", "chocolate", "bread",
            "candy", "sweet", "drink", "juice", "coffee", "tea", "water",
            "sauce", "oil", "flour", "pasta", "rice", "cheese", "yogurt",
            "biscuit", "cookie", "chip", "fruit", "vegetable");

    /**
     * Detects the product category from OpenFoodFacts categories_tags.
     * Returns GENERAL if no known category keywords are matched.
     *
     * @param categoriesTags list of category tags e.g. ["en:chocolates",
     *                       "en:snacks"]
     * @return best-matching ProductCategory
     */
    public ProductCategory detect(List<String> categoriesTags) {
        if (categoriesTags == null || categoriesTags.isEmpty()) {
            return ProductCategory.GENERAL;
        }

        String joined = String.join(" ", categoriesTags).toLowerCase()
                .replace("en:", "")
                .replace("-", " ");

        if (matchesAny(joined, TOY_KEYWORDS))
            return ProductCategory.TOY;
        if (matchesAny(joined, BEAUTY_KEYWORDS))
            return ProductCategory.BEAUTY;
        if (matchesAny(joined, FASHION_KEYWORDS))
            return ProductCategory.FASHION;
        if (matchesAny(joined, FOOD_KEYWORDS))
            return ProductCategory.FOOD;

        log.debug("No category matched for tags: {}", categoriesTags);
        return ProductCategory.GENERAL;
    }

    private boolean matchesAny(String text, List<String> keywords) {
        for (String keyword : keywords) {
            if (text.contains(keyword))
                return true;
        }
        return false;
    }
}
