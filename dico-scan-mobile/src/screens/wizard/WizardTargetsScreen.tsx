// src/screens/wizard/WizardTargetsScreen.tsx

import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { TARGET_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardTargets">;

export default function WizardTargetsScreen({ navigation }: Props) {
    const { targets, toggleTarget } = useSafetyProfileStore();

    const handleNext = () => {
        if (targets.includes("CHILD")) {
            navigation.navigate("WizardChild");
        } else if (targets.includes("PREGNANT")) {
            navigation.navigate("WizardPregnancy");
        } else {
            navigation.navigate("WizardFoodAllergy");
        }
    };

    return (
        <WizardLayout
            step={1}
            totalSteps={8}
            title="Hồ sơ dành cho ai?"
            subtitle="Chọn tất cả đối tượng phù hợp"
            canNext={targets.length > 0}
            onNext={handleNext}
            onBack={() => navigation.goBack()}
        >
            <View style={styles.options}>
                {TARGET_OPTIONS.map((opt) => {
                    const selected = targets.includes(opt.value);
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.optionCard, selected && styles.optionSelected]}
                            onPress={() => toggleTarget(opt.value)}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.optionLabel}>{opt.label}</Text>
                            <Text style={[styles.optionDesc, selected && styles.optionDescSelected]}>
                                {opt.desc}
                            </Text>
                            {selected && <Text style={styles.checkmark}>✓</Text>}
                        </TouchableOpacity>
                    );
                })}
            </View>
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    options: { gap: 12 },
    optionCard: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 18,
        borderWidth: 2,
        borderColor: "transparent",
        position: "relative",
    },
    optionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "#1E1B4B",
    },
    optionLabel: { color: COLORS.text, fontSize: 17, fontWeight: "600", marginBottom: 4 },
    optionDesc: { color: COLORS.textMuted, fontSize: 13 },
    optionDescSelected: { color: "#A5B4FC" },
    checkmark: {
        position: "absolute",
        top: 16,
        right: 16,
        color: COLORS.primary,
        fontSize: 20,
        fontWeight: "700",
    },
});
