// src/utils/productCache.ts
// Lightweight offline cache for product evaluation results.
// Stores last-scanned products in AsyncStorage with TTL (24h).
// Used as fallback when network is unavailable.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { ProductEvaluationResponse } from "@/api/types";

const CACHE_PREFIX = "@dico_product_";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHED_PRODUCTS = 30;
const META_KEY = "@dico_product_cache_meta";

interface CacheEntry {
    data: ProductEvaluationResponse;
    cachedAt: number;
}

interface CacheMeta {
    keys: string[]; // LRU list of barcodes (newest first)
}

/**
 * Save a product to the offline cache (LRU, max 30 products).
 */
export async function cacheProduct(barcode: string, product: ProductEvaluationResponse): Promise<void> {
    try {
        const entry: CacheEntry = { data: product, cachedAt: Date.now() };
        await AsyncStorage.setItem(`${CACHE_PREFIX}${barcode}`, JSON.stringify(entry));

        // Update LRU meta
        const meta = await getMeta();
        const keys = [barcode, ...meta.keys.filter((k) => k !== barcode)];
        // Evict oldest if over limit
        if (keys.length > MAX_CACHED_PRODUCTS) {
            const evicted = keys.splice(MAX_CACHED_PRODUCTS);
            await AsyncStorage.multiRemove(evicted.map((k) => `${CACHE_PREFIX}${k}`));
        }
        await AsyncStorage.setItem(META_KEY, JSON.stringify({ keys }));
    } catch {
        // Cache errors are non-fatal — silently ignore
    }
}

/**
 * Retrieve a product from the offline cache.
 * Returns null if not cached or TTL expired.
 */
export async function getCachedProduct(barcode: string): Promise<ProductEvaluationResponse | null> {
    try {
        const raw = await AsyncStorage.getItem(`${CACHE_PREFIX}${barcode}`);
        if (!raw) return null;

        const entry: CacheEntry = JSON.parse(raw);
        const isExpired = Date.now() - entry.cachedAt > CACHE_TTL_MS;
        if (isExpired) {
            AsyncStorage.removeItem(`${CACHE_PREFIX}${barcode}`).catch(() => { });
            return null;
        }
        return entry.data;
    } catch {
        return null;
    }
}

/**
 * Get all cached barcodes (LRU order, for HomeScreen "recent" offline fallback).
 */
export async function getCachedBarcodes(): Promise<string[]> {
    const meta = await getMeta();
    return meta.keys;
}

async function getMeta(): Promise<CacheMeta> {
    try {
        const raw = await AsyncStorage.getItem(META_KEY);
        return raw ? JSON.parse(raw) : { keys: [] };
    } catch {
        return { keys: [] };
    }
}
