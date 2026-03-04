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
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { usePreferencesStore } from "@/store/userPreferencesStore";
import { useAuthStore } from "@/store/authStore";
import { ALLERGEN_OPTIONS, DIET_OPTIONS } from "@/api/types";
import { updatePreferences } from "@/api/users";
import { RootStackParamList } from "@/navigation/RootNavigator";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function PreferencesScreen() {
    const { allergies, diet, toggleAllergy, setDiet } = usePreferencesStore();
    const [saving, setSaving] = React.useState(false);
    const navigation = useNavigation<NavProp>();

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

            {/* Safety Profile CTA Card */}
            <TouchableOpacity
                style={styles.profileCard}
                onPress={() => navigation.navigate("SafetyWizard")}
                activeOpacity={0.8}
            >
                <View style={styles.profileCardContent}>
                    <Text style={styles.profileIcon}>🛡️</Text>
                    <View style={styles.profileTextBlock}>
                        <Text style={styles.profileTitle}>Hồ sơ An toàn</Text>
                        <Text style={styles.profileDesc}>
                            Thiết lập hồ sơ sức khỏe để nhận cảnh báo cá nhân hóa khi quét sản phẩm
                        </Text>
                    </View>
                    <Text style={styles.profileArrow}>→</Text>
                </View>
                <View style={styles.premiumBadge}>
                    <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                </View>
            </TouchableOpacity>

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

            {/* Account Section */}
            <AccountSection />
        </ScrollView>
    );
}

function AccountSection() {
    const { email, displayName, logout } = useAuthStore();

    const handleLogout = () => {
        Alert.alert("Đăng xuất", "Bạn có chắc muốn đăng xuất?", [
            { text: "Hủy", style: "cancel" },
            { text: "Đăng xuất", style: "destructive", onPress: () => logout() },
        ]);
    };

    return (
        <View style={accountStyles.container}>
            <View style={accountStyles.divider} />
            <Text style={accountStyles.sectionTitle}>👤 Tài khoản</Text>
            <View style={accountStyles.infoCard}>
                <Text style={accountStyles.email}>{email ?? "—"}</Text>
                {displayName && <Text style={accountStyles.name}>{displayName}</Text>}
            </View>
            <TouchableOpacity style={accountStyles.logoutBtn} onPress={handleLogout}>
                <Text style={accountStyles.logoutBtnText}>🚪 Đăng xuất</Text>
            </TouchableOpacity>
        </View>
    );
}

const accountStyles = StyleSheet.create({
    container: { marginTop: 12 },
    divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 20 },
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600", marginBottom: 12 },
    infoCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
    email: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
    name: { color: COLORS.textMuted, fontSize: 13, marginTop: 4 },
    logoutBtn: { backgroundColor: "#450A0A", padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.danger },
    logoutBtnText: { color: "#FCA5A5", fontSize: 15, fontWeight: "600" },
});

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 40 },
    title: { color: COLORS.text, fontSize: 24, fontWeight: "700", marginBottom: 24 },

    // Safety Profile Card
    profileCard: {
        backgroundColor: "#1E1B4B",
        borderRadius: 16,
        padding: 18,
        marginBottom: 28,
        borderWidth: 1,
        borderColor: COLORS.primary,
        position: "relative",
    },
    profileCardContent: { flexDirection: "row", alignItems: "center", gap: 14 },
    profileIcon: { fontSize: 36 },
    profileTextBlock: { flex: 1 },
    profileTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginBottom: 4 },
    profileDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
    profileArrow: { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
    premiumBadge: {
        position: "absolute",
        top: -8,
        right: 12,
        backgroundColor: COLORS.warning,
        borderRadius: 6,
        paddingHorizontal: 8,
        paddingVertical: 2,
    },
    premiumBadgeText: { color: "#000", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

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
