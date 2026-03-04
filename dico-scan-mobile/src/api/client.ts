// src/api/client.ts
// Axios instance configured for DICO Scan backend.
// All screens/hooks must import from this file — never from axios directly.

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { StandardError } from "./types";

const BASE_URL =
    process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:8080";
const TIMEOUT_MS = parseInt(
    process.env["EXPO_PUBLIC_API_TIMEOUT_MS"] ?? "5000"
);

export const apiClient = axios.create({
    baseURL: BASE_URL,
    timeout: TIMEOUT_MS,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
    },
});

// Request Interceptor: Attach JWT Bearer token (or fallback X-User-Id)
apiClient.interceptors.request.use(async (config) => {
    try {
        const raw = await AsyncStorage.getItem("@dico_auth");
        if (raw) {
            const auth = JSON.parse(raw);
            if (auth.token) {
                config.headers["Authorization"] = `Bearer ${auth.token}`;
            }
        } else {
            // Fallback: legacy X-User-Id for dev/test
            const userId = await AsyncStorage.getItem("userId");
            if (userId) {
                config.headers["X-User-Id"] = userId;
            }
        }
    } catch {
        // AsyncStorage failure is non-blocking
    }
    return config;
});

// Response Interceptor: Normalize errors to StandardError shape
apiClient.interceptors.response.use(
    (res) => res,
    (error: unknown) => {
        if (axios.isAxiosError(error) && error.response?.data) {
            // Backend returned a StandardError
            return Promise.reject(error.response.data as StandardError);
        }
        // Network error or timeout
        const fallback: StandardError = {
            errorCode: "NETWORK_ERROR",
            message: "Không thể kết nối tới server. Vui lòng kiểm tra mạng.",
            traceId: "unknown",
        };
        return Promise.reject(fallback);
    }
);
