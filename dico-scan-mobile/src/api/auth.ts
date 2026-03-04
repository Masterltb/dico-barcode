// src/api/auth.ts

import { apiClient } from "./client";

export interface AuthResponse {
    token: string;
    userId: string;
    email: string;
    displayName: string | null;
    subscriptionTier: string;
}

/**
 * POST /v1/auth/register
 */
export const register = async (
    email: string,
    password: string,
    displayName?: string
): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/v1/auth/register", {
        email,
        password,
        displayName: displayName || null,
    });
    return data;
};

/**
 * POST /v1/auth/login
 */
export const login = async (
    email: string,
    password: string
): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>("/v1/auth/login", {
        email,
        password,
    });
    return data;
};
