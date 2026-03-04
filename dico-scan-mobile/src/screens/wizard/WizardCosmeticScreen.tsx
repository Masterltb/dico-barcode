// src/screens/wizard/WizardCosmeticScreen.tsx

import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { COSMETIC_SENSITIVITY_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardCosmetic">;

export default function WizardCosmeticScreen({ navigation }: Props) {
    const {
        cosmeticSensitivities, toggleCosmeticSensitivity,
        customCosmeticSensitivities, addCustomCosmeticSensitivity, removeCustomCosmeticSensitivity,
    } = useSafetyProfileStore();
    const [customInput, setCustomInput] = useState("");

    const handleAdd = () => {
        if (customInput.trim()) {
            addCustomCosmeticSensitivity(customInput);
            setCustomInput("");
        }
    };

    return (
        <WizardLayout
            step={5}
            totalSteps={8}
            title="💄 Nhạy cảm mỹ phẩm"
            subtitle="Chọn thành phần mỹ phẩm mà bạn muốn được cảnh báo"
            canNext={true}
            onNext={() => navigation.navigate("WizardSkinType")}
            onBack={() => navigation.goBack()}
        >
            <Text style={styles.counter}>
                Đã chọn: {cosmeticSensitivities.length}/15
            </Text>
            <View style={styles.chipRow}>
                {COSMETIC_SENSITIVITY_OPTIONS.map((opt) => {
                    const sel = cosmeticSensitivities.includes(opt.value);
                    const disabled = !sel && cosmeticSensitivities.length >= 15;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected, disabled && styles.chipDisabled]}
                            onPress={() => !disabled && toggleCosmeticSensitivity(opt.value)}
                        >
                            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Custom */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Thành phần khác ({customCosmeticSensitivities.length}/5)
            </Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.textInput}
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="Ví dụ: oxybenzone..."
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={100}
                    onSubmitEditing={handleAdd}
                />
                <TouchableOpacity
                    style={[styles.addBtn, (!customInput.trim() || customCosmeticSensitivities.length >= 5) && styles.addBtnDisabled]}
                    onPress={handleAdd}
                    disabled={!customInput.trim() || customCosmeticSensitivities.length >= 5}
                >
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>
            {customCosmeticSensitivities.map((item, i) => (
                <View key={i} style={styles.customTag}>
                    <Text style={styles.customTagText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeCustomCosmeticSensitivity(i)}>
                        <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 10 },
    counter: { color: COLORS.primary, fontSize: 13, fontWeight: "600", marginBottom: 12 },
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    chipDisabled: { opacity: 0.35 },
    chipText: { color: COLORS.textMuted, fontSize: 14 },
    chipTextSelected: { color: COLORS.white, fontWeight: "600" },
    inputRow: { flexDirection: "row", gap: 8, marginBottom: 8 },
    textInput: { flex: 1, backgroundColor: COLORS.surface, color: COLORS.text, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, borderWidth: 1, borderColor: COLORS.border },
    addBtn: { backgroundColor: COLORS.primary, borderRadius: 10, width: 48, justifyContent: "center", alignItems: "center" },
    addBtnDisabled: { opacity: 0.4 },
    addBtnText: { color: COLORS.white, fontSize: 22, fontWeight: "700" },
    customTag: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 8, padding: 10, marginBottom: 6, justifyContent: "space-between" },
    customTagText: { color: COLORS.text, fontSize: 14 },
    removeBtn: { color: COLORS.danger, fontSize: 16, fontWeight: "600", paddingHorizontal: 8 },
});
