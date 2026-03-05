package com.dico.scan.dto.response;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

/**
 * Response DTO for GET /v1/users/me/preferences
 * Shows the user's current saved allergy list and diet preference.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserPreferencesResponse(
                /** List of allergy identifiers the user has saved. */
                List<String> allergies,

                /** Diet tag: vegan, vegetarian, keto, halal, etc. Empty string if not set. */
                String diet,

                /** User's subscription tier. */
                String subscriptionTier,

                /** True if the full safety profile wizard has been completed. */
                boolean profileCompleted,

                /** Full safety profile data (conditions, severity, body targets, etc) */
                java.util.Map<String, Object> safetyProfile) {
}
