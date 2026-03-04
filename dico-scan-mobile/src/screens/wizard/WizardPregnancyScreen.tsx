// src/screens/wizard/WizardPregnancyScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { TRIMESTER_OPTIONS, ALERT_LEVEL_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardPregnancy">;

export default function WizardPregnancyScreen({ navigation }: Props) {
    const { pregnancyProfile, setPregnancyProfile } = useSafetyProfileStore();

    const canNext = pregnancyProfile.trimester !== null;

    return (
        <WizardLayout
            step={3}
            totalSteps={8}
            title="🤰 Hồ sơ thai kỳ"
            subtitle="Giúp chúng tôi cảnh báo các thành phần không an toàn cho thai kỳ"
            canNext={canNext}
            onNext={() => navigation.navigate("WizardFoodAllergy")}
            onBack={() => navigation.goBack()}
        >
            {/* Trimester */}
            <Text style={styles.sectionTitle}>Giai đoạn thai kỳ *</Text>
            {TRIMESTER_OPTIONS.map((opt) => {
                const sel = pregnancyProfile.trimester === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.radioCard, sel && styles.radioSelected]}
                        onPress={() => setPregnancyProfile({ trimester: opt.value })}
                    >
                        <Text style={[styles.radioLabel, sel && styles.radioLabelSelected]}>
                            {sel ? "● " : "○ "}{opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}

            {/* Alert Level */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mức cảnh báo</Text>
            {ALERT_LEVEL_OPTIONS.map((opt) => {
                const sel = pregnancyProfile.alertLevel === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.radioCard, sel && styles.radioSelected]}
                        onPress={() => setPregnancyProfile({ alertLevel: opt.value })}
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
    radioCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: "transparent" },
    radioSelected: { borderColor: COLORS.primary, backgroundColor: "#1E1B4B" },
    radioLabel: { color: COLORS.text, fontSize: 15, fontWeight: "600", marginBottom: 2 },
    radioLabelSelected: { color: COLORS.primary },
    radioDesc: { color: COLORS.textMuted, fontSize: 13 },
});
