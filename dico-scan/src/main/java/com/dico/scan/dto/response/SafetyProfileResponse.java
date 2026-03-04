package com.dico.scan.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;
import java.util.Map;

/**
 * Response DTO for GET /v1/users/me/safety-profile
 * Returns the user's complete safety profile for the confirmation screen.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record SafetyProfileResponse(
        List<String> targets,
        ChildProfile childProfile,
        PregnancyProfile pregnancyProfile,
        List<String> foodAllergies,
        List<String> customFoodAllergies,
        List<String> cosmeticSensitivities,
        List<String> customCosmeticSensitivities,
        String skinType,
        List<String> healthConditions,
        List<String> dietaryPreferences,
        String alertLevel,
        String allergySeverity,
        boolean profileCompleted) {
    public record ChildProfile(String ageGroup, List<String> allergies,
            List<String> customAllergies, String severityLevel) {
    }

    public record PregnancyProfile(String trimester, String alertLevel) {
    }

    /** Factory — build from raw JSONB Map */
    @SuppressWarnings("unchecked")
    public static SafetyProfileResponse fromMap(Map<String, Object> map, boolean completed) {
        if (map == null || map.isEmpty()) {
            return new SafetyProfileResponse(null, null, null, null, null, null, null,
                    null, null, null, null, null, completed);
        }

        ChildProfile child = null;
        Object childObj = map.get("childProfile");
        if (childObj instanceof Map<?, ?> cm) {
            Map<String, Object> c = (Map<String, Object>) cm;
            child = new ChildProfile(
                    (String) c.get("ageGroup"),
                    (List<String>) c.get("allergies"),
                    (List<String>) c.get("customAllergies"),
                    (String) c.get("severityLevel"));
        }

        PregnancyProfile preg = null;
        Object pregObj = map.get("pregnancyProfile");
        if (pregObj instanceof Map<?, ?> pm) {
            Map<String, Object> p = (Map<String, Object>) pm;
            preg = new PregnancyProfile((String) p.get("trimester"), (String) p.get("alertLevel"));
        }

        return new SafetyProfileResponse(
                (List<String>) map.get("targets"),
                child, preg,
                (List<String>) map.get("foodAllergies"),
                (List<String>) map.get("customFoodAllergies"),
                (List<String>) map.get("cosmeticSensitivities"),
                (List<String>) map.get("customCosmeticSensitivities"),
                (String) map.get("skinType"),
                (List<String>) map.get("healthConditions"),
                (List<String>) map.get("dietaryPreferences"),
                (String) map.get("alertLevel"),
                (String) map.get("allergySeverity"),
                completed);
    }
}
