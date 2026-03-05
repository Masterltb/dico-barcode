// src/store/userPreferencesStore.ts
// Zustand store: user allergies + diet preference.
// Persists to AsyncStorage on every change.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { SafetyProfileResponse } from "@/api/types";

const STORAGE_KEY = "dico:preferences";

interface PreferencesState {
    allergies: string[];
    diet: string;
    safetyProfile: SafetyProfileResponse | null;
    isHydrated: boolean;
    setAllergies: (allergies: string[]) => void;
    toggleAllergy: (allergen: string) => void;
    setDiet: (diet: string) => void;
    setSafetyProfile: (profile: SafetyProfileResponse | null) => void;
    hydrate: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
    allergies: [],
    diet: "NONE",
    safetyProfile: null,
    isHydrated: false,

    setAllergies: (allergies) => {
        set({ allergies });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies, diet: get().diet, safetyProfile: get().safetyProfile }));
    },

    toggleAllergy: (allergen) => {
        const current = get().allergies;
        const next = current.includes(allergen)
            ? current.filter((a) => a !== allergen)
            : current.length < 5
                ? [...current, allergen]
                : current; // max 5 — RULE: AC_PREF_01
        set({ allergies: next });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: next, diet: get().diet, safetyProfile: get().safetyProfile }));
    },

    setDiet: (diet) => {
        set({ diet });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: get().allergies, diet, safetyProfile: get().safetyProfile }));
    },

    setSafetyProfile: (safetyProfile) => {
        set({ safetyProfile });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: get().allergies, diet: get().diet, safetyProfile }));
    },

    hydrate: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const { allergies, diet, safetyProfile } = JSON.parse(raw) as { allergies: string[]; diet: string; safetyProfile: SafetyProfileResponse | null };
                set({ allergies, diet, safetyProfile: safetyProfile || null, isHydrated: true });
            } else {
                set({ isHydrated: true });
            }
        } catch {
            set({ isHydrated: true });
        }
    },
}));
