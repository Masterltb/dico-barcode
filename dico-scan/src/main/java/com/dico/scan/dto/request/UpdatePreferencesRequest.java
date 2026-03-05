package com.dico.scan.dto.request;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for PUT /v1/users/me/preferences
 * Idempotent — sending the same data multiple times yields the same DB state.
 */
public record UpdatePreferencesRequest(
                /**
                 * List of allergy identifiers.
                 * Max 20 items to prevent payload abuse.
                 * Example values: "peanuts", "gluten", "dairy", "shellfish"
                 */
                @NotNull @Size(max = 20) List<String> allergies,

                /**
                 * Diet type tag.
                 * Example: "vegan", "vegetarian", "keto", "halal"
                 */
                @Size(max = 50) String diet,

                /**
                 * Full safety profile data from the wizard.
                 * Optional.
                 */
                java.util.Map<String, Object> safetyProfile) {
}
