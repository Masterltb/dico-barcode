// src/screens/wizard/WizardChildScreen.tsx

import React, { useState } from "react";
import { StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { CHILD_AGE_OPTIONS, FOOD_ALLERGY_OPTIONS, SEVERITY_OPTIONS } from "@/api/types";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";
import WizardLayout from "./WizardLayout";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardChild">;

export default function WizardChildScreen({ navigation }: Props) {
    const { childProfile, setChildProfile, targets } = useSafetyProfileStore();
    const [customInput, setCustomInput] = useState("");

    const toggleChildAllergy = (allergy: string) => {
        const current = childProfile.allergies;
        const next = current.includes(allergy)
            ? current.filter((a) => a !== allergy)
            : current.length < 20
                ? [...current, allergy]
                : current;
        setChildProfile({ allergies: next });
    };

    const addCustomAllergy = () => {
        if (customInput.trim() && childProfile.customAllergies.length < 5) {
            setChildProfile({
                customAllergies: [...childProfile.customAllergies, customInput.trim()],
            });
            setCustomInput("");
        }
    };

    const removeCustomAllergy = (index: number) => {
        setChildProfile({
            customAllergies: childProfile.customAllergies.filter((_, i) => i !== index),
        });
    };

    const handleNext = () => {
        if (targets.includes("PREGNANT")) {
            navigation.navigate("WizardPregnancy");
        } else {
            navigation.navigate("WizardFoodAllergy");
        }
    };

    const canNext = childProfile.ageGroup !== null;

    return (
        <WizardLayout
            step={2}
            totalSteps={8}
            title="👶 Hồ sơ trẻ em"
            subtitle="Thiết lập thông tin bảo vệ cho con bạn"
            canNext={canNext}
            onNext={handleNext}
            onBack={() => navigation.goBack()}
        >
            {/* Age Group */}
            <Text style={styles.sectionTitle}>Nhóm tuổi *</Text>
            <View style={styles.chipRow}>
                {CHILD_AGE_OPTIONS.map((opt) => {
                    const sel = childProfile.ageGroup === opt.value;
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected]}
                            onPress={() => setChildProfile({ ageGroup: opt.value })}
                        >
                            <Text style={[styles.chipText, sel && styles.chipTextSelected]}>
                                {opt.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Allergies */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
                Dị ứng của bé ({childProfile.allergies.length}/20)
            </Text>
            <View style={styles.chipRow}>
                {FOOD_ALLERGY_OPTIONS.map((opt) => {
                    const sel = childProfile.allergies.includes(opt.value);
                    return (
                        <TouchableOpacity
                            key={opt.value}
                            style={[styles.chip, sel && styles.chipSelected]}
                            onPress={() => toggleChildAllergy(opt.value)}
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
                Dị ứng khác ({childProfile.customAllergies.length}/5)
            </Text>
            <View style={styles.inputRow}>
                <TextInput
                    style={styles.textInput}
                    value={customInput}
                    onChangeText={setCustomInput}
                    placeholder="Nhập tên dị ứng..."
                    placeholderTextColor={COLORS.textMuted}
                    maxLength={100}
                />
                <TouchableOpacity
                    style={[styles.addBtn, (!customInput.trim() || childProfile.customAllergies.length >= 5) && styles.addBtnDisabled]}
                    onPress={addCustomAllergy}
                    disabled={!customInput.trim() || childProfile.customAllergies.length >= 5}
                >
                    <Text style={styles.addBtnText}>+</Text>
                </TouchableOpacity>
            </View>
            {childProfile.customAllergies.map((item, i) => (
                <View key={i} style={styles.customTag}>
                    <Text style={styles.customTagText}>{item}</Text>
                    <TouchableOpacity onPress={() => removeCustomAllergy(i)}>
                        <Text style={styles.removeBtn}>✕</Text>
                    </TouchableOpacity>
                </View>
            ))}

            {/* Severity */}
            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Mức độ phản ứng</Text>
            {SEVERITY_OPTIONS.map((opt) => {
                const sel = childProfile.severityLevel === opt.value;
                return (
                    <TouchableOpacity
                        key={opt.value}
                        style={[styles.radioCard, sel && styles.radioSelected]}
                        onPress={() => setChildProfile({ severityLevel: opt.value })}
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
    chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    chipSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
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
    radioCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 2, borderColor: "transparent" },
    radioSelected: { borderColor: COLORS.primary, backgroundColor: "#1E1B4B" },
    radioLabel: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 2 },
    radioLabelSelected: { color: COLORS.primary },
    radioDesc: { color: COLORS.textMuted, fontSize: 13 },
});
