// src/constants/queryKeys.ts
// TanStack Query key factory — avoids cache key collisions.

export const queryKeys = {
    product: (barcode: string) => ["product", barcode] as const,
    history: (page: number) => ["history", page] as const,
    preferences: () => ["preferences"] as const,
} as const;
