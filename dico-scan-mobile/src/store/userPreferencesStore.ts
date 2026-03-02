// src/store/userPreferencesStore.ts
// Zustand store: user allergies + diet preference.
// Persists to AsyncStorage on every change.

import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";

const STORAGE_KEY = "dico:preferences";

interface PreferencesState {
    allergies: string[];
    diet: string;
    isHydrated: boolean;
    setAllergies: (allergies: string[]) => void;
    toggleAllergy: (allergen: string) => void;
    setDiet: (diet: string) => void;
    hydrate: () => Promise<void>;
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
    allergies: [],
    diet: "NONE",
    isHydrated: false,

    setAllergies: (allergies) => {
        set({ allergies });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies, diet: get().diet }));
    },

    toggleAllergy: (allergen) => {
        const current = get().allergies;
        const next = current.includes(allergen)
            ? current.filter((a) => a !== allergen)
            : current.length < 5
                ? [...current, allergen]
                : current; // max 5 — RULE: AC_PREF_01
        set({ allergies: next });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: next, diet: get().diet }));
    },

    setDiet: (diet) => {
        set({ diet });
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ allergies: get().allergies, diet }));
    },

    hydrate: async () => {
        try {
            const raw = await AsyncStorage.getItem(STORAGE_KEY);
            if (raw) {
                const { allergies, diet } = JSON.parse(raw) as { allergies: string[]; diet: string };
                set({ allergies, diet, isHydrated: true });
            } else {
                set({ isHydrated: true });
            }
        } catch {
            set({ isHydrated: true });
        }
    },
}));
