// src/api/users.ts

import { apiClient } from "./client";
import { UpdatePreferencesRequest, UserPreferencesResponse } from "./types";

/**
 * GET /v1/users/me/preferences
 * Lấy dị ứng + chế độ ăn đã lưu từ server.
 */
export const getPreferences = async (): Promise<UserPreferencesResponse> => {
    const { data } = await apiClient.get<UserPreferencesResponse>("/v1/users/me/preferences");
    return data;
};

/**
 * PUT /v1/users/me/preferences
 * Cập nhật dị ứng + chế độ ăn. PREMIUM only.
 * Trả về state mới nhất sau khi lưu.
 */
export const updatePreferences = async (
    payload: UpdatePreferencesRequest
): Promise<UserPreferencesResponse> => {
    const { data } = await apiClient.put<UserPreferencesResponse>("/v1/users/me/preferences", payload);
    return data;
};
