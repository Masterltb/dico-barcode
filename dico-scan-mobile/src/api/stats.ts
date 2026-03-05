// src/api/stats.ts
import { apiClient } from "./client";

export interface UserStatsResponse {
    totalScanned: number;
    greenCount: number;
    yellowCount: number;
    redCount: number;
    unknownCount: number;
    greenPercent: number;
    redPercent: number;
    lastScannedBarcode: string | null;
    peakScanDayOfWeek: number;
    safetyScore: number;
}

export interface FavoriteItem {
    id: string;
    userId: string;
    barcode: string;
    label: "SAFE" | "AVOID";
    note: string | null;
    addedAt: string;
}

export interface FavoriteStatusResponse {
    isFavorited: boolean;
    label: "SAFE" | "AVOID" | "";
    note: string;
}

/** GET /v1/users/me/stats */
export const getUserStats = async (): Promise<UserStatsResponse> => {
    const { data } = await apiClient.get<UserStatsResponse>("/v1/users/me/stats");
    return data;
};

/** GET /v1/favorites */
export const getFavorites = async (): Promise<FavoriteItem[]> => {
    const { data } = await apiClient.get<FavoriteItem[]>("/v1/favorites");
    return data;
};

/** GET /v1/favorites/{barcode}/status */
export const getFavoriteStatus = async (barcode: string): Promise<FavoriteStatusResponse> => {
    const { data } = await apiClient.get<FavoriteStatusResponse>(`/v1/favorites/${barcode}/status`);
    return data;
};

/** POST /v1/favorites/{barcode}?label=SAFE|AVOID */
export const upsertFavorite = async (barcode: string, label: "SAFE" | "AVOID", note?: string): Promise<FavoriteItem> => {
    const params: Record<string, string> = { label };
    if (note) params.note = note;
    const { data } = await apiClient.post<FavoriteItem>(`/v1/favorites/${barcode}`, null, { params });
    return data;
};

/** DELETE /v1/favorites/{barcode} */
export const removeFavorite = async (barcode: string): Promise<void> => {
    await apiClient.delete(`/v1/favorites/${barcode}`);
};
