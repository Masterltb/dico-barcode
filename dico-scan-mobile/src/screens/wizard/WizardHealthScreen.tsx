// src/screens/wizard/WizardHealthScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { HEALTH_CONDITION_OPTIONS, DIETARY_PREF_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardHealth">;

export default function WizardHealthScreen({ navigation }: Props) {
    const {
        healthConditions, toggleHealthCondition,
        dietaryPreferences, toggleDietaryPreference,
    } = useSafetyProfileStore();

    return (
        <WizardLayout
            step={7}
            totalSteps={8}
            title="🏥 Sức khỏe & Chế độ ăn"
            subtitle="Giúp AI đưa ra cảnh báo phù hợp với tình trạng sức khỏe của bạn"
            canNext={true}
            onNext={() => navigation.navigate("WizardSeverity")}
            onBack={() => navigation.goBack()}
        >
            {/* Health Conditions */}
            <Text style={styles.sectionTitle}>Tình trạng sức khỏe</Text>
            <Text style={styles.hint}>Chọn "Không có" nếu không áp dụng</Text>
            <View style={styles.chipRow}>
                {HEALTH_CONDITION_OPTIONS.map((opt) => {
                    const sel = healthConditions.includes(opt.value);
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected]}
                            onPress={() => toggleHealthCondition(opt.value)}
                        >
                            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Dietary Preferences */}
            <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Chế độ ăn uống</Text>
            <Text style={styles.hint}>Chọn các chế độ ăn bạn đang theo</Text>
            <View style={styles.chipRow}>
                {DIETARY_PREF_OPTIONS.map((opt) => {
                    const sel = dietaryPreferences.includes(opt.value);
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected]}
                            onPress={() => toggleDietaryPreference(opt.value)}
                        >
                            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 4 },
    hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipText: { color: COLORS.textMuted, fontSize: 14 },
    chipTextSelected: { color: COLORS.white, fontWeight: "600" },
});
