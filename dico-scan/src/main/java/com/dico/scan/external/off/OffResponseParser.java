package com.dico.scan.external.off;

import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Null-safe parser for OpenFoodFacts raw API response (JSONB Map).
 * OFF data is community-contributed and notoriously inconsistent.
 * Every field access uses fallback defaults to prevent NPEs propagating to the
 * scoring engine.
 */
@Slf4j
public class OffResponseParser {

    private OffResponseParser() {
        // Static utility — no instantiation
    }

    /**
     * Parses a raw OFF API response map into a structured, null-safe OffProductData
     * record.
     *
     * @param barcode    the barcode used for the request (for logging)
     * @param rawProduct the "product" sub-object from the OFF JSON response
     */
    @SuppressWarnings("unchecked")
    public static OffProductData parse(String barcode, Map<String, Object> rawProduct) {
        if (rawProduct == null) {
            log.warn("OFF returned null product object for barcode: {}", barcode);
            return emptyProduct(barcode);
        }

        String productName = getString(rawProduct, "product_name");
        String brand = getString(rawProduct, "brands");
        String imageUrl = getString(rawProduct, "image_url");
        String ingredients = getString(rawProduct, "ingredients_text");

        // Nutriscore grade — normalize to uppercase (OFF returns lowercase 'a','b'...)
        String nutriscoreRaw = getString(rawProduct, "nutriscore_grade");
        String nutriscoreGrade = nutriscoreRaw.isEmpty() ? "" : nutriscoreRaw.toUpperCase();

        // NOVA group — stored as integer
        Integer novaGroup = getInteger(rawProduct, "nova_group");

        // Additives — list of "en:e102" style tags
        List<String> additivesTags = getStringList(rawProduct, "additives_tags");
        List<String> allergensHierarchy = getStringList(rawProduct, "allergens_hierarchy");

        // Nutriments sub-object
        Object nutrimentObj = rawProduct.get("nutriments");
        Map<String, Object> nutriments = (nutrimentObj instanceof Map<?, ?> m)
                ? (Map<String, Object>) m
                : Collections.emptyMap();

        double energy = getDouble(nutriments, "energy-kcal_100g");
        double sugars = getDouble(nutriments, "sugars_100g");
        double salt = getDouble(nutriments, "salt_100g");

        boolean hasCompleteData = !nutriscoreGrade.isEmpty()
                && novaGroup != null
                && !ingredients.isEmpty();

        return new OffProductData(
                barcode, productName, brand, imageUrl,
                nutriscoreGrade, novaGroup,
                additivesTags, ingredients, allergensHierarchy,
                energy, sugars, salt,
                hasCompleteData);
    }

    // ===== Safe extraction helpers =====

    private static String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return val instanceof String s ? s.trim() : "";
    }

    private static Integer getInteger(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Integer i)
            return i;
        if (val instanceof Number n)
            return n.intValue();
        if (val instanceof String s) {
            try {
                return Integer.parseInt(s.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return null;
    }

    private static double getDouble(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof Number n)
            return n.doubleValue();
        if (val instanceof String s) {
            try {
                return Double.parseDouble(s.trim());
            } catch (NumberFormatException ignored) {
            }
        }
        return 0.0;
    }

    private static List<String> getStringList(Map<String, Object> map, String key) {
        Object val = map.get(key);
        if (val instanceof List<?> list) {
            return list.stream()
                    .filter(e -> e instanceof String)
                    .map(e -> (String) e)
                    .toList();
        }
        return Collections.emptyList();
    }

    private static OffProductData emptyProduct(String barcode) {
        return new OffProductData(
                barcode, "", "", "", "", null,
                Collections.emptyList(), "",
                Collections.emptyList(),
                0, 0, 0,
                false);
    }
}
