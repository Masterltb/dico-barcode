// src/api/types.ts
// Mirrors backend DTO types exactly. Update when backend DTOs change.

export type RatingColor = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

/** Mirrors: ProductEvaluationResponse.java */
export interface ProductEvaluationResponse {
    barcode: string;
    name: string | null;
    brand: string | null;
    imageUrl: string | null;
    rating: RatingColor;
    score: number | null;
    confidenceScore: number;
    aiSummary: string | null;
    overrideReasons: string[] | null;
    cachedAt: string;
}

/** Mirrors: ScanHistoryItemResponse.java */
export interface ScanHistoryItem {
    barcode: string;
    name: string | null;
    scannedAt: string;
    snapshotColor: RatingColor;
}

/** Mirrors: StandardError.java */
export interface StandardError {
    errorCode: string;
    message: string;
    traceId: string;
}

/** Mirrors: UpdatePreferencesRequest.java */
export interface UpdatePreferencesRequest {
    allergies: string[];
    diet: string;
}

export const ALLERGEN_OPTIONS = [
    "gluten",
    "peanut",
    "shellfish",
    "milk",
    "egg",
    "soy",
    "tree_nut",
    "fish",
] as const;

export type AllergenKey = (typeof ALLERGEN_OPTIONS)[number];

export const DIET_OPTIONS = [
    { label: "Không giới hạn", value: "NONE" },
    { label: "Chay", value: "VEGETARIAN" },
    { label: "Thuần chay", value: "VEGAN" },
    { label: "Ít đường", value: "LOW_SUGAR" },
    { label: "Ít muối", value: "LOW_SALT" },
] as const;
