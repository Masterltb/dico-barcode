// src/api/subscriptions.ts

import { apiClient } from "./client";

export interface UpgradeResponse {
    subscriptionTier: "FREE" | "PREMIUM";
    message: string;
    upgraded: boolean;
}

export interface TierStatusResponse {
    subscriptionTier: "FREE" | "PREMIUM";
    profileCompleted: boolean;
    userId: string;
}

/** GET /v1/subscriptions/status */
export const getTierStatus = async (): Promise<TierStatusResponse> => {
    const { data } = await apiClient.get<TierStatusResponse>("/v1/subscriptions/status");
    return data;
};

/** POST /v1/subscriptions/upgrade — Dev: instant upgrade, Prod: payment gateway */
export const upgradeToPremdium = async (): Promise<UpgradeResponse> => {
    const { data } = await apiClient.post<UpgradeResponse>("/v1/subscriptions/upgrade");
    return data;
};
