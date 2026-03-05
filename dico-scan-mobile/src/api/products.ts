// src/api/products.ts

import { apiClient } from "./client";
import { PageResponse, ProductEvaluationResponse, ScanHistoryItem } from "./types";

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
 * GET /v1/users/me/scan-history?keyword=&page=&size=
 * Lịch sử quét + search theo barcode.
 */
export const getScanHistory = async (
    page = 0,
    size = 20,
    keyword?: string
): Promise<ScanHistoryItem[]> => {
    const params: Record<string, unknown> = { page, size };
    if (keyword && keyword.trim()) params.keyword = keyword.trim();
    const { data } = await apiClient.get<PageResponse<ScanHistoryItem>>(
        "/v1/users/me/scan-history",
        { params }
    );
    return data.content;
};
