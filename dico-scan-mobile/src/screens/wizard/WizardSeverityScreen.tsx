// src/screens/wizard/WizardSeverityScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { ALERT_LEVEL_OPTIONS, SEVERITY_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardSeverity">;

export default function WizardSeverityScreen({ navigation }: Props) {
    const { alertLevel, setAlertLevel, allergySeverity, setAllergySeverity } =
        useSafetyProfileStore();

    const canNext = alertLevel !== null && allergySeverity !== null;

    return (
        <WizardLayout
            step={8}
            totalSteps={8}
            title="🔔 Mức độ cảnh báo"
            subtitle="Tùy chỉnh độ nhạy cảnh báo khi quét sản phẩm"
            canNext={canNext}
            onNext={() => navigation.navigate("WizardConfirm")}
            onBack={() => navigation.goBack()}
            nextLabel="Xem lại"
        >
            {/* Alert Level */}
            <Text style={styles.sectionTitle}>Mức cảnh báo chung *</Text>
            {ALERT_LEVEL_OPTIONS.map((opt) => {
                const sel = alertLevel === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.radioCard, sel && styles.radioSelected]}
                        onPress={() => setAlertLevel(opt.value)}
                    >
                        <Text style={[styles.radioLabel, sel && styles.radioLabelSelected]}>
                            {opt.label}
                        </Text>
                        <Text style={styles.radioDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                );
            })}

            {/* Allergy Severity */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mức độ dị ứng *</Text>
            <Text style={styles.hint}>
                Mức nặng sẽ bao gồm cảnh báo cross-contamination
            </Text>
            {SEVERITY_OPTIONS.map((opt) => {
                const sel = allergySeverity === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.radioCard, sel && styles.radioSelected]}
                        onPress={() => setAllergySeverity(opt.value)}
                    >
                        <Text style={[styles.radioLabel, sel && styles.radioLabelSelected]}>
                            {opt.label}
                        </Text>
                        <Text style={styles.radioDesc}>{opt.desc}</Text>
                    </TouchableOpacity>
                );
            })}
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 10 },
    hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
    radioCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: "transparent" },
    radioSelected: { borderColor: COLORS.primary, backgroundColor: "#1E1B4B" },
    radioLabel: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 2 },
    radioLabelSelected: { color: COLORS.primary },
    radioDesc: { color: COLORS.textMuted, fontSize: 13 },
});
