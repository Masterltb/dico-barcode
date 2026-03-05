// src/hooks/useAlternatives.ts
// Fetches alternative product recommendations for a given barcode.
// Only enabled when rating is YELLOW or RED (no need for GREEN products).

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/api/client";

export interface AlternativeProduct {
    barcode: string | null;
    name: string;
    brand: string;
    imageUrl: string | null;
    rating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    score: number | null;
    category: string;
    reason: string;
    source: "DB" | "AI";
    isScannableInApp: boolean;
}

const fetchAlternatives = async (barcode: string): Promise<AlternativeProduct[]> => {
    const { data } = await apiClient.get<AlternativeProduct[]>(
        `/v1/products/${barcode}/alternatives?limit=5`
    );
    return data;
};

/**
 * Fetches product alternatives.
 * @param barcode           - Current product barcode
 * @param enabled           - Should be true only when product rating !== GREEN
 */
export const useAlternatives = (barcode: string, enabled: boolean) => {
    return useQuery<AlternativeProduct[]>({
        queryKey: ["alternatives", barcode],
        queryFn: () => fetchAlternatives(barcode),
        enabled: enabled && !!barcode,
        staleTime: 1000 * 60 * 30,  // 30 min — alternatives rarely change
        retry: 1,
    });
};
