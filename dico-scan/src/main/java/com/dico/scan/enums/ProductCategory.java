package com.dico.scan.enums;

/**
 * Product category detected from OpenFoodFacts categories_tags field.
 * Determines which scoring logic and AI prompt template to use.
 */
public enum ProductCategory {
    FOOD, // Thực phẩm: Nutri/Nova/Additives scoring
    TOY, // Đồ chơi: age_limit, choking hazard
    BEAUTY, // Mỹ phẩm: paraben, sulfate, irritant ingredients
    FASHION, // Thời trang: textile chemicals, allergens
    GENERAL // Chung: AI-only analysis
}
