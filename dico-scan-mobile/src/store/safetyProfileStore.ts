// src/store/safetyProfileStore.ts
// Zustand store: multi-step wizard state for Safety Profile.

import { create } from "zustand";
import {
    ChildProfileRequest,
    PregnancyProfileRequest,
    SafetyProfileRequest,
} from "@/api/types";

interface SafetyProfileState {
    // Step data
    targets: string[];
    childProfile: ChildProfileRequest;
    pregnancyProfile: PregnancyProfileRequest;
    foodAllergies: string[];
    customFoodAllergies: string[];
    cosmeticSensitivities: string[];
    customCosmeticSensitivities: string[];
    skinType: string | null;
    healthConditions: string[];
    dietaryPreferences: string[];
    alertLevel: string | null;
    allergySeverity: string | null;

    // Actions
    setTargets: (targets: string[]) => void;
    toggleTarget: (target: string) => void;
    setChildProfile: (profile: Partial<ChildProfileRequest>) => void;
    setPregnancyProfile: (profile: Partial<PregnancyProfileRequest>) => void;
    setFoodAllergies: (allergies: string[]) => void;
    toggleFoodAllergy: (allergy: string) => void;
    addCustomFoodAllergy: (allergy: string) => void;
    removeCustomFoodAllergy: (index: number) => void;
    setCosmeticSensitivities: (items: string[]) => void;
    toggleCosmeticSensitivity: (item: string) => void;
    addCustomCosmeticSensitivity: (item: string) => void;
    removeCustomCosmeticSensitivity: (index: number) => void;
    setSkinType: (skinType: string | null) => void;
    setHealthConditions: (conditions: string[]) => void;
    toggleHealthCondition: (condition: string) => void;
    setDietaryPreferences: (prefs: string[]) => void;
    toggleDietaryPreference: (pref: string) => void;
    setAlertLevel: (level: string | null) => void;
    setAllergySeverity: (severity: string | null) => void;

    // Helpers
    toRequest: () => SafetyProfileRequest;
    loadFromResponse: (data: SafetyProfileRequest) => void;
    reset: () => void;
}

const INITIAL_CHILD: ChildProfileRequest = {
    ageGroup: null,
    allergies: [],
    customAllergies: [],
    severityLevel: null,
};

const INITIAL_PREGNANCY: PregnancyProfileRequest = {
    trimester: null,
    alertLevel: null,
};

export const useSafetyProfileStore = create<SafetyProfileState>((set, get) => ({
    targets: [],
    childProfile: { ...INITIAL_CHILD },
    pregnancyProfile: { ...INITIAL_PREGNANCY },
    foodAllergies: [],
    customFoodAllergies: [],
    cosmeticSensitivities: [],
    customCosmeticSensitivities: [],
    skinType: null,
    healthConditions: [],
    dietaryPreferences: [],
    alertLevel: null,
    allergySeverity: null,

    setTargets: (targets) => set({ targets }),
    toggleTarget: (target) => {
        const current = get().targets;
        const next = current.includes(target)
            ? current.filter((t) => t !== target)
            : [...current, target];
        set({ targets: next });
    },

    setChildProfile: (profile) =>
        set((s) => ({ childProfile: { ...s.childProfile, ...profile } })),

    setPregnancyProfile: (profile) =>
        set((s) => ({ pregnancyProfile: { ...s.pregnancyProfile, ...profile } })),

    setFoodAllergies: (allergies) => set({ foodAllergies: allergies }),
    toggleFoodAllergy: (allergy) => {
        const current = get().foodAllergies;
        const next = current.includes(allergy)
            ? current.filter((a) => a !== allergy)
            : current.length < 20
                ? [...current, allergy]
                : current;
        set({ foodAllergies: next });
    },

    addCustomFoodAllergy: (allergy) => {
        const current = get().customFoodAllergies;
        if (current.length < 5 && allergy.trim()) {
            set({ customFoodAllergies: [...current, allergy.trim()] });
        }
    },
    removeCustomFoodAllergy: (index) => {
        set({ customFoodAllergies: get().customFoodAllergies.filter((_, i) => i !== index) });
    },

    setCosmeticSensitivities: (items) => set({ cosmeticSensitivities: items }),
    toggleCosmeticSensitivity: (item) => {
        const current = get().cosmeticSensitivities;
        const next = current.includes(item)
            ? current.filter((i) => i !== item)
            : current.length < 15
                ? [...current, item]
                : current;
        set({ cosmeticSensitivities: next });
    },

    addCustomCosmeticSensitivity: (item) => {
        const current = get().customCosmeticSensitivities;
        if (current.length < 5 && item.trim()) {
            set({ customCosmeticSensitivities: [...current, item.trim()] });
        }
    },
    removeCustomCosmeticSensitivity: (index) => {
        set({ customCosmeticSensitivities: get().customCosmeticSensitivities.filter((_, i) => i !== index) });
    },

    setSkinType: (skinType) => set({ skinType }),

    setHealthConditions: (conditions) => set({ healthConditions: conditions }),
    toggleHealthCondition: (condition) => {
        const current = get().healthConditions;
        if (condition === "NONE") {
            set({ healthConditions: ["NONE"] });
            return;
        }
        const withoutNone = current.filter((c) => c !== "NONE");
        const next = withoutNone.includes(condition)
            ? withoutNone.filter((c) => c !== condition)
            : [...withoutNone, condition];
        set({ healthConditions: next });
    },

    setDietaryPreferences: (prefs) => set({ dietaryPreferences: prefs }),
    toggleDietaryPreference: (pref) => {
        const current = get().dietaryPreferences;
        if (pref === "NONE") {
            set({ dietaryPreferences: ["NONE"] });
            return;
        }
        const withoutNone = current.filter((p) => p !== "NONE");
        const next = withoutNone.includes(pref)
            ? withoutNone.filter((p) => p !== pref)
            : [...withoutNone, pref];
        set({ dietaryPreferences: next });
    },

    setAlertLevel: (level) => set({ alertLevel: level }),
    setAllergySeverity: (severity) => set({ allergySeverity: severity }),

    toRequest: (): SafetyProfileRequest => {
        const s = get();
        return {
            targets: s.targets,
            childProfile: s.targets.includes("CHILD") ? s.childProfile : null,
            pregnancyProfile: s.targets.includes("PREGNANT") ? s.pregnancyProfile : null,
            foodAllergies: s.foodAllergies,
            customFoodAllergies: s.customFoodAllergies,
            cosmeticSensitivities: s.cosmeticSensitivities,
            customCosmeticSensitivities: s.customCosmeticSensitivities,
            skinType: s.skinType,
            healthConditions: s.healthConditions,
            dietaryPreferences: s.dietaryPreferences,
            alertLevel: s.alertLevel,
            allergySeverity: s.allergySeverity,
        };
    },

    loadFromResponse: (data) => {
        set({
            targets: data.targets ?? [],
            childProfile: data.childProfile ?? { ...INITIAL_CHILD },
            pregnancyProfile: data.pregnancyProfile ?? { ...INITIAL_PREGNANCY },
            foodAllergies: data.foodAllergies ?? [],
            customFoodAllergies: data.customFoodAllergies ?? [],
            cosmeticSensitivities: data.cosmeticSensitivities ?? [],
            customCosmeticSensitivities: data.customCosmeticSensitivities ?? [],
            skinType: data.skinType ?? null,
            healthConditions: data.healthConditions ?? [],
            dietaryPreferences: data.dietaryPreferences ?? [],
            alertLevel: data.alertLevel ?? null,
            allergySeverity: data.allergySeverity ?? null,
        });
    },

    reset: () =>
        set({
            targets: [],
            childProfile: { ...INITIAL_CHILD },
            pregnancyProfile: { ...INITIAL_PREGNANCY },
            foodAllergies: [],
            customFoodAllergies: [],
            cosmeticSensitivities: [],
            customCosmeticSensitivities: [],
            skinType: null,
            healthConditions: [],
            dietaryPreferences: [],
            alertLevel: null,
            allergySeverity: null,
        }),
}));
