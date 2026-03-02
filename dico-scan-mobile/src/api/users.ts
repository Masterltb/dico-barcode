// src/api/users.ts

import { apiClient } from "./client";
import { UpdatePreferencesRequest } from "./types";

/**
 * PUT /v1/users/me/preferences
 */
export const updatePreferences = async (
    payload: UpdatePreferencesRequest
): Promise<void> => {
    await apiClient.put("/v1/users/me/preferences", payload);
};
