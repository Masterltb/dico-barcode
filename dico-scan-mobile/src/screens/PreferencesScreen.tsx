// src/screens/PreferencesScreen.tsx
// Màn hình Cài đặt cá nhân — hiển thị dị ứng + diet đã lưu, cho phép chỉnh sửa (PREMIUM)

import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { usePreferencesStore } from "@/store/userPreferencesStore";
import { ALLERGEN_OPTIONS, DIET_OPTIONS } from "@/api/types";
import { getPreferences, updatePreferences } from "@/api/users";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { TARGET_OPTIONS } from "@/api/types";

type NavProp = NativeStackNavigationProp<RootStackParamList>;

export default function PreferencesScreen() {
    const navigation = useNavigation<NavProp>();
    const queryClient = useQueryClient();
    const { setAllergies, setDiet, setSafetyProfile } = usePreferencesStore();

    // Local edit state — mirrors server state while editing
    const [editAllergies, setEditAllergies] = useState<string[]>([]);
    const [editDiet, setEditDiet] = useState<string>("NONE");
    const [isEditing, setIsEditing] = useState(false);

    // ── Fetch preferences từ server ──────────────────────────────
    const { data, isLoading, isError, refetch } = useQuery({
        queryKey: ["userPreferences"],
        queryFn: getPreferences,
    });

    // Sync local edit state khi data load về
    useEffect(() => {
        if (data && !isEditing) {
            setEditAllergies(data.allergies ?? []);
            setEditDiet(data.diet ?? "NONE");
            if (data.safetyProfile) {
                setSafetyProfile(data.safetyProfile);
            }
        }
    }, [data, isEditing]);

    const isPremium = data?.subscriptionTier === "PREMIUM";
    const safetyProfile = usePreferencesStore((s) => s.safetyProfile);

    // Helper: Map target Enum to Label
    const getTargetLabels = (targets: string[]) => {
        if (!targets || targets.length === 0) return "Chưa chọn";
        return targets
            .map(t => TARGET_OPTIONS.find(opt => opt.value === t)?.label || t)
            .join(", ");
    };

    // ── Mutation save ─────────────────────────────────────────────
    const mutation = useMutation({
        mutationFn: () => updatePreferences({
            allergies: editAllergies,
            diet: editDiet,
            safetyProfile: usePreferencesStore.getState().safetyProfile || undefined
        }),
        onSuccess: (updated) => {
            // Cập nhật cache React Query + local Zustand store
            queryClient.setQueryData(["userPreferences"], updated);
            setAllergies(updated.allergies);
            setDiet(updated.diet);
            if (updated.safetyProfile) {
                setSafetyProfile(updated.safetyProfile);
            }
            setIsEditing(false);
            Alert.alert("✅ Đã lưu", "Cài đặt dị ứng của bạn đã được cập nhật.");
        },
        onError: () => {
            Alert.alert("Lỗi", "Không thể lưu. Vui lòng thử lại.");
        },
    });

    const toggleAllergy = (allergen: string) => {
        if (!isPremium) return;
        setEditAllergies((prev) =>
            prev.includes(allergen)
                ? prev.filter((a) => a !== allergen)
                : prev.length < 20 ? [...prev, allergen] : prev
        );
    };

    const handleCancelEdit = () => {
        setEditAllergies(data?.allergies ?? []);
        setEditDiet(data?.diet ?? "NONE");
        setIsEditing(false);
    };

    // ── Loading / Error states ────────────────────────────────────
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>Đang tải cài đặt...</Text>
            </View>
        );
    }

    if (isError) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Không thể tải cài đặt</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>⚙️ Cài đặt cá nhân</Text>
                {isPremium && !isEditing && (
                    <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
                        <Text style={styles.editBtnText}>✏️ Chỉnh sửa</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Tier Badge */}
            <View style={[styles.tierBadge, isPremium ? styles.tierPremium : styles.tierFree]}>
                <Text style={styles.tierIcon}>{isPremium ? "⭐" : "🆓"}</Text>
                <View style={{ flex: 1 }}>
                    <Text style={styles.tierLabel}>{isPremium ? "PREMIUM" : "FREE"}</Text>
                    <Text style={styles.tierDesc}>
                        {isPremium
                            ? "Cảnh báo cá nhân hóa đang hoạt động"
                            : "Nâng cấp để lưu hồ sơ dị ứng cá nhân"}
                    </Text>
                </View>
                {data?.profileCompleted && (
                    <View style={styles.completedBadge}>
                        <Text style={styles.completedText}>✓ Hoàn chỉnh</Text>
                    </View>
                )}
                {!isPremium && (
                    <TouchableOpacity
                        style={styles.upgradeChip}
                        onPress={() => navigation.navigate("Upgrade")}
                    >
                        <Text style={styles.upgradeChipText}>⭐ Nâng cấp</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Safety Profile Card — chỉ khi PREMIUM */}
            {isPremium && (
                <TouchableOpacity
                    style={styles.profileCard}
                    onPress={() => navigation.navigate("SafetyWizard")}
                    activeOpacity={0.8}
                >
                    <View style={styles.profileCardContent}>
                        <Text style={styles.profileIcon}>🛡️</Text>
                        <View style={styles.profileTextBlock}>
                            <Text style={styles.profileTitle}>
                                {data?.profileCompleted ? "Chỉnh sửa Hồ sơ An toàn" : "Thiết lập Hồ sơ An toàn"}
                            </Text>
                            <Text style={styles.profileDesc}>
                                {data?.profileCompleted
                                    ? "Hồ sơ đã hoàn thành. Nhấn để cập nhật."
                                    : "Thiết lập để nhận cảnh báo cá nhân hóa khi quét sản phẩm"}
                            </Text>
                        </View>
                        <Text style={styles.profileArrow}>→</Text>
                    </View>
                    <View style={styles.premiumBadge}>
                        <Text style={styles.premiumBadgeText}>PREMIUM</Text>
                    </View>
                </TouchableOpacity>
            )}

            {/* Hiển thị chi tiết Safety Profile nếu đã cấu hình */}
            {isPremium && data?.profileCompleted && safetyProfile && (
                <View style={[styles.section, styles.profileDetailsBox]}>
                    <Text style={styles.sectionTitle}>🛡️ Chi tiết Hồ sơ An toàn</Text>

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Đối tượng bảo vệ:</Text>
                        <Text style={styles.detailValue}>{getTargetLabels(safetyProfile.targets)}</Text>
                    </View>

                    {safetyProfile.healthConditions && safetyProfile.healthConditions.length > 0 && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Bệnh lý quan tâm:</Text>
                            <Text style={styles.detailValue}>{safetyProfile.healthConditions.join(", ")}</Text>
                        </View>
                    )}

                    {safetyProfile.cosmeticSensitivities && safetyProfile.cosmeticSensitivities.length > 0 && (
                        <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Nhạy cảm mỹ phẩm:</Text>
                            <Text style={styles.detailValue}>{safetyProfile.cosmeticSensitivities.join(", ")}</Text>
                        </View>
                    )}

                    <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Mức độ cảnh báo:</Text>
                        <Text style={styles.detailValue}>
                            {safetyProfile.alertLevel === "STRICT" ? "Nghiêm ngặt (Đỏ/Vàng)" : "Tiêu chuẩn (Đỏ)"}
                        </Text>
                    </View>
                </View>
            )}

            {/* Allergy Section */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>
                        🚫 Dị ứng thực phẩm{" "}
                        <Text style={styles.counter}>({editAllergies.length} đã chọn)</Text>
                    </Text>
                </View>

                {!isPremium && (
                    <View style={styles.lockedBanner}>
                        <Text style={styles.lockedText}>🔒 Yêu cầu gói PREMIUM để lưu dị ứng</Text>
                    </View>
                )}

                {isPremium && isEditing && (
                    <Text style={styles.hint}>
                        Chọn các chất bạn dị ứng. Sản phẩm chứa các chất này sẽ bị đánh dấu ĐỎ.
                    </Text>
                )}

                <View style={styles.tags}>
                    {ALLERGEN_OPTIONS.map((allergen) => {
                        const isSelected = editAllergies.includes(allergen);
                        const canToggle = isPremium && isEditing;
                        return (
                            <TouchableOpacity
                                key={allergen}
                                onPress={() => canToggle && toggleAllergy(allergen)}
                                style={[
                                    styles.tag,
                                    isSelected && styles.tagSelected,
                                    !canToggle && !isSelected && styles.tagReadonly,
                                ]}
                                activeOpacity={canToggle ? 0.7 : 1}
                            >
                                <Text style={[styles.tagText, isSelected && styles.tagTextSelected]}>
                                    {allergen.replace("_", " ")}
                                </Text>
                                {isSelected && !isEditing && (
                                    <Text style={styles.tagCheck}> ✓</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>

                {editAllergies.length === 0 && !isEditing && (
                    <Text style={styles.emptyHint}>Chưa có dị ứng nào được lưu</Text>
                )}
            </View>

            {/* Diet Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>🥗 Chế độ ăn</Text>
                {DIET_OPTIONS.map((option) => {
                    const isSelected = editDiet === option.value;
                    const canToggle = isPremium && isEditing;
                    return (
                        <TouchableOpacity
                            key={option.value}
                            style={[
                                styles.dietOption,
                                isSelected && styles.dietSelected,
                                !canToggle && styles.dietReadonly,
                            ]}
                            onPress={() => canToggle && setEditDiet(option.value)}
                            activeOpacity={canToggle ? 0.7 : 1}
                        >
                            <Text style={[styles.dietText, isSelected && styles.dietTextSelected]}>
                                {isSelected ? "● " : "○ "}{option.label}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {/* Action Buttons — Editing mode */}
            {isPremium && isEditing && (
                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                        <Text style={styles.cancelBtnText}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.saveBtn, mutation.isPending && styles.saveBtnDisabled]}
                        onPress={() => mutation.mutate()}
                        disabled={mutation.isPending}
                    >
                        <Text style={styles.saveBtnText}>
                            {mutation.isPending ? "Đang lưu..." : "💾 Lưu thay đổi"}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}

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

// ── Styles ──────────────────────────────────────────────────────
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
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, padding: 24 },
    muted: { color: COLORS.textMuted, fontSize: 14 },
    errorText: { color: COLORS.danger, fontSize: 15 },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryText: { color: COLORS.white, fontWeight: "600" },

    // Header
    headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
    title: { color: COLORS.text, fontSize: 24, fontWeight: "700" },
    editBtn: { backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    editBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },

    // Tier badge
    tierBadge: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 14, marginBottom: 20 },
    tierPremium: { backgroundColor: "#1E1B4B", borderWidth: 1, borderColor: COLORS.primary },
    tierFree: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    tierIcon: { fontSize: 28 },
    tierLabel: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
    tierDesc: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    completedBadge: { marginLeft: "auto", backgroundColor: "#166534", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
    completedText: { color: "#86EFAC", fontSize: 11, fontWeight: "700" },

    // Safety Profile card
    profileCard: { backgroundColor: "#1E1B4B", borderRadius: 16, padding: 18, marginBottom: 28, borderWidth: 1, borderColor: COLORS.primary, position: "relative" },
    profileCardContent: { flexDirection: "row", alignItems: "center", gap: 14 },
    profileIcon: { fontSize: 36 },
    profileTextBlock: { flex: 1 },
    profileTitle: { color: COLORS.text, fontSize: 17, fontWeight: "700", marginBottom: 4 },
    profileDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },
    profileArrow: { color: COLORS.primary, fontSize: 22, fontWeight: "700" },
    premiumBadge: { position: "absolute", top: -8, right: 12, backgroundColor: COLORS.warning, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
    premiumBadgeText: { color: "#000", fontSize: 10, fontWeight: "800", letterSpacing: 0.5 },

    // Sections
    section: { marginBottom: 28 },
    sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    sectionTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
    counter: { color: COLORS.primary },
    hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: 12 },
    emptyHint: { color: COLORS.textMuted, fontSize: 13, fontStyle: "italic", marginTop: 8 },

    // Locked banner
    lockedBanner: { backgroundColor: "#1C1C1E", borderRadius: 10, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
    lockedText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },

    // Safety Profile Details
    profileDetailsBox: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 28 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: "#333" },
    detailLabel: { color: COLORS.textMuted, fontSize: 14, flex: 1 },
    detailValue: { color: COLORS.text, fontSize: 14, fontWeight: "600", flex: 2, textAlign: "right" },

    // Tags (allergy chips)
    tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    tag: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface, flexDirection: "row", alignItems: "center" },
    tagSelected: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    tagReadonly: { opacity: 0.5 },
    tagText: { color: COLORS.textMuted, fontSize: 14 },
    tagTextSelected: { color: COLORS.white, fontWeight: "600" },
    tagCheck: { color: COLORS.white, fontSize: 12 },

    // Diet options
    dietOption: { paddingVertical: 14, paddingHorizontal: 16, borderRadius: 10, backgroundColor: COLORS.surface, marginBottom: 8 },
    dietSelected: { borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: "#1E1B4B" },
    dietReadonly: { opacity: 0.7 },
    dietText: { color: COLORS.textMuted, fontSize: 15 },
    dietTextSelected: { color: COLORS.primary, fontWeight: "600" },

    // Action buttons
    actionRow: { flexDirection: "row", gap: 12, marginTop: 4, marginBottom: 16 },
    cancelBtn: { flex: 1, padding: 14, borderRadius: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
    cancelBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: "600" },
    saveBtn: { flex: 2, backgroundColor: COLORS.primary, padding: 14, borderRadius: 12, alignItems: "center" },
    saveBtnDisabled: { opacity: 0.6 },
    saveBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },

    // Upgrade chip (FREE user CTA)
    upgradeChip: { backgroundColor: COLORS.primary, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10 },
    upgradeChipText: { color: COLORS.white, fontSize: 12, fontWeight: "700" },
});
