// src/api/safetyProfile.ts

import { apiClient } from "./client";
import { SafetyProfileRequest, SafetyProfileResponse } from "./types";

/**
 * PUT /v1/users/me/safety-profile
 * Saves the complete safety profile questionnaire (PREMIUM only).
 */
export const saveSafetyProfile = async (
    payload: SafetyProfileRequest
): Promise<void> => {
    await apiClient.put("/v1/users/me/safety-profile", payload);
};

/**
 * GET /v1/users/me/safety-profile
 * Returns the user's current safety profile for the confirmation/edit screen.
 */
export const getSafetyProfile = async (): Promise<SafetyProfileResponse> => {
    const { data } = await apiClient.get<SafetyProfileResponse>(
        "/v1/users/me/safety-profile"
    );
    return data;
};
