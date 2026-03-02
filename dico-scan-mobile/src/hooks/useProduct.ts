// src/hooks/useProduct.ts
// TanStack Query wrapper for GET /v1/products/{barcode}

import { useQuery } from "@tanstack/react-query";
import { getProduct } from "@/api/products";
import { queryKeys } from "@/constants/queryKeys";
import { usePreferencesStore } from "@/store/userPreferencesStore";

export const useProduct = (barcode: string) => {
    const allergies = usePreferencesStore((s) => s.allergies);

    return useQuery({
        queryKey: queryKeys.product(barcode),
        queryFn: () => getProduct(barcode, allergies),
        staleTime: 1000 * 60 * 5, // 5 minutes — aligns with backend 90-day cache TTL
        retry: (failureCount, error: unknown) => {
            // Don't retry on 404 (product not in OFF)
            if (typeof error === "object" && error !== null && "errorCode" in error) {
                const err = error as { errorCode: string };
                if (err.errorCode === "PRODUCT_NOT_FOUND") return false;
            }
            return failureCount < 2;
        },
    });
};
