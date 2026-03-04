// src/screens/wizard/WizardSkinTypeScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { SKIN_TYPE_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardSkinType">;

export default function WizardSkinTypeScreen({ navigation }: Props) {
    const { skinType, setSkinType } = useSafetyProfileStore();

    return (
        <WizardLayout
            step={6}
            totalSteps={8}
            title="🧴 Loại da của bạn"
            subtitle="Giúp AI đánh giá mỹ phẩm phù hợp hơn với làn da của bạn"
            canNext={true}
            onNext={() => navigation.navigate("WizardHealth")}
            onBack={() => navigation.goBack()}
        >
            {SKIN_TYPE_OPTIONS.map((opt) => {
                const sel = skinType === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.card, sel && styles.cardSelected]}
                        onPress={() => setSkinType(opt.value)}
                    >
                        <Text style={[styles.cardLabel, sel && styles.cardLabelSelected]}>
                            {opt.label}
                        </Text>
                    </TouchableOpacity>
                );
            })}
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 18,
        marginBottom: 10,
        borderWidth: 2,
        borderColor: "transparent",
    },
    cardSelected: {
        borderColor: COLORS.primary,
        backgroundColor: "#1E1B4B",
    },
    cardLabel: { color: COLORS.text, fontSize: 17, fontWeight: "600" },
    cardLabelSelected: { color: COLORS.primary },
});
