// src/api/products.ts

import { apiClient } from "./client";
import { ProductEvaluationResponse, ScanHistoryItem } from "./types";

/**
 * GET /v1/products/{barcode}
 * GUARDRAIL (RULE_MOB_01): Returns `rating` field from server.
 * Mobile NEVER calculates rating color.
 */
export const getProduct = async (
    barcode: string,
    allergies: string[] = []
): Promise<ProductEvaluationResponse> => {
    const params =
        allergies.length > 0 ? { allergies: allergies.join(",") } : {};
    const { data } = await apiClient.get<ProductEvaluationResponse>(
        `/v1/products/${barcode}`,
        { params }
    );
    return data;
};

/**
 * GET /v1/users/me/history
 */
export const getScanHistory = async (
    page = 0,
    size = 20
): Promise<ScanHistoryItem[]> => {
    const { data } = await apiClient.get<ScanHistoryItem[]>(
        "/v1/users/me/history",
        { params: { page, size } }
    );
    return data;
};
