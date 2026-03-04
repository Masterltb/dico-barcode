// src/screens/wizard/WizardFoodAllergyScreen.tsx

import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { FOOD_ALLERGY_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardFoodAllergy">;

export default function WizardFoodAllergyScreen({ navigation }: Props) {
    const {
        foodAllergies, toggleFoodAllergy,
        customFoodAllergies, addCustomFoodAllergy, removeCustomFoodAllergy,
    } = useSafetyProfileStore();
    const [customInput, setCustomInput] = useState("");

    const handleAdd = () => {
        if (customInput.trim()) {
            addCustomFoodAllergy(customInput);
            setCustomInput("");
        }
    };

    return (
        <WizardLayout
            step={4}
            totalSteps={8}
            title="⚠️ Dị ứng thực phẩm"
            subtitle="Chọn các chất gây dị ứng. Sản phẩm chứa chúng sẽ được cảnh báo đặc biệt."
            canNext={true}
            onNext={() => navigation.navigate("WizardCosmetic")}
            onBack={() => navigation.goBack()}
        >
            <Text style={styles.counter}>
                Đã chọn: {foodAllergies.length}/20
            </Text>
            <View style={styles.chipRow}>
                {FOOD_ALLERGY_OPTIONS.map((opt) => {
                    const sel = foodAllergies.includes(opt.value);
                    const disabled = !sel && foodAllergies.length >= 20;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected, disabled && styles.chipDisabled]}
                            onPress={() => !disabled && toggleFoodAllergy(opt.value)}
                        >
                            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Custom Allergies */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Dị ứng khác ({customFoodAllergies.length}/5)
            </Text>
            <Text style={styles.hint}>Nhập dị ứng không có trong danh sách trên</Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.textInput}
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="Ví dụ: keo ong, quế..."
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={100}
                    onSubmitEditing={handleAdd}
                />
                <TouchableOpacity
                    style={[styles.addBtn, (!customInput.trim() || customFoodAllergies.length >= 5) && styles.addBtnDisabled]}
                    onPress={handleAdd}
                    disabled={!customInput.trim() || customFoodAllergies.length >= 5}
                >
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>
            {customFoodAllergies.map((item, i) => (
                <View key={i} style={styles.customTag}>
                    <Text style={styles.customTagText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeCustomFoodAllergy(i)}>
                        <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                </View>
            ))}
        </WizardLayout>
    );
}

const styles = StyleSheet.create({
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 6 },
    counter: { color: COLORS.primary, fontSize: 13, fontWeight: "600", marginBottom: 12 },
    hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 10 },
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
