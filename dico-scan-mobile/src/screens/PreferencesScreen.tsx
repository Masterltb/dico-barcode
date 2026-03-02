// src/screens/PreferencesScreen.tsx

import React from "react";
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { usePreferencesStore } from "@/store/userPreferencesStore";
import { ALLERGEN_OPTIONS, DIET_OPTIONS } from "@/api/types";
import { updatePreferences } from "@/api/users";

export default function PreferencesScreen() {
    const { allergies, diet, toggleAllergy, setDiet } = usePreferencesStore();
    const [saving, setSaving] = React.useState(false);

    const handleSave = async () => {
        setSaving(true);
        try {
            await updatePreferences({ allergies, diet });
            Alert.alert("✅ Đã lưu", "Cài đặt của bạn đã được cập nhật.");
        } catch {
            Alert.alert("Lỗi", "Không thể lưu cài đặt. Vui lòng thử lại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            <Text style={styles.title}>⚙️ Cài đặt cá nhân</Text>

            {/* Allergy Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                    Dị ứng thực phẩm{" "}
                    <Text style={styles.counter}>({allergies.length}/5)</Text>
                </Text>
                <Text style={styles.hint}>
                    Chọn tối đa 5. Sản phẩm chứa các chất này sẽ bị đánh dấu ĐỎ.
                </Text>
                <View style={styles.tags}>
                    {ALLERGEN_OPTIONS.map((allergen) => {
                        const isSelected = allergies.includes(allergen);
                        const isDisabled = !isSelected && allergies.length >= 5;
                        return (
                            <TouchableOpacity
                                key={allergen}
                                onPress={() => !isDisabled && toggleAllergy(allergen)}
                                style={[
                                    styles.tag,
                                    isSelected && styles.tagSelected,
                                    isDisabled && styles.tagDisabled,
                                ]}
                            >
                                <Text
                                    style={[
                                        styles.tagText,
                                        isSelected && styles.tagTextSelected,
                                        isDisabled && styles.tagTextDisabled,
                                    ]}
                                >
                                    {allergen.replace("_", " ")}
                                </Text>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>

            {/* Diet Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Chế độ ăn</Text>
                {DIET_OPTIONS.map((option) => (
                    <TouchableOpacity
                        key={option.value}
                        style={[styles.dietOption, diet === option.value && styles.dietSelected]}
                        onPress={() => setDiet(option.value)}
                    >
                        <Text style={[styles.dietText, diet === option.value && styles.dietTextSelected]}>
                            {diet === option.value ? "● " : "○ "}{option.label}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Save Button */}
            <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
            >
                <Text style={styles.saveBtnText}>
                    {saving ? "Đang lưu..." : "Lưu cài đặt"}
                </Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 40 },
    title: { color: COLORS.text, fontSize: 24, fontWeight: "700", marginBottom: 24 },
    section: { marginBottom: 28 },
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 4 },
    counter: { color: COLORS.primary },
    hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
    tagSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tagDisabled: { opacity: 0.4 },
    tagText: { color: COLORS.textMuted, fontSize: 14 },
    tagTextSelected: { color: COLORS.white, fontWeight: "600" },
    tagTextDisabled: { color: COLORS.textMuted },
    dietOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.surface, marginBottom: 8 },
    dietSelected: { borderWidth: 1, borderColor: COLORS.primary },
    dietText: { color: COLORS.textMuted, fontSize: 15 },
    dietTextSelected: { color: COLORS.primary, fontWeight: "600" },
    saveBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center", marginTop: 8 },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
