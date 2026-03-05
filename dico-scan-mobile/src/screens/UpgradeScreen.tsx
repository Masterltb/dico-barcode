// src/screens/UpgradeScreen.tsx
// Màn hình nâng cấp gói PREMIUM — hiển thị benefits và nút upgrade

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
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { upgradeToPremdium } from "@/api/subscriptions";

const PREMIUM_BENEFITS = [
    {
        icon: "🛡️",
        title: "Hồ sơ An toàn Cá nhân",
        desc: "Cài đặt dị ứng, thể trạng, tình trạng sức khỏe — AI cảnh báo chính xác cho BẠN",
    },
    {
        icon: "⚡",
        title: "Cảnh báo Dị ứng Tức thì",
        desc: "Quét sản phẩm → nhận cảnh báo ngay nếu chứa chất bạn dị ứng",
    },
    {
        icon: "✨",
        title: "AI Tóm tắt Cá nhân hóa",
        desc: "Phân tích dựa trên hồ sơ sức khỏe của bạn, không phải phân tích chung",
    },
    {
        icon: "👶",
        title: "Bảo vệ Cả Gia đình",
        desc: "Thiết lập hồ sơ cho con nhỏ, phụ nữ mang thai, người có bệnh lý",
    },
    {
        icon: "🔍",
        title: "Lịch sử Quét Đầy đủ",
        desc: "Xem lại toàn bộ sản phẩm đã quét, lọc theo mức độ an toàn",
    },
];

export default function UpgradeScreen() {
    const navigation = useNavigation();
    const queryClient = useQueryClient();
    const { setFromResponse } = useAuthStore();

    const mutation = useMutation({
        mutationFn: upgradeToPremdium,
        onSuccess: (res) => {
            // Invalidate preferences cache để refresh tier
            queryClient.invalidateQueries({ queryKey: ["userPreferences"] });

            if (res.upgraded) {
                Alert.alert(
                    "🎉 Chào mừng PREMIUM!",
                    "Tài khoản của bạn đã được nâng cấp. Hãy thiết lập Hồ sơ An toàn để bắt đầu!",
                    [{ text: "Thiết lập ngay", onPress: () => navigation.goBack() }]
                );
            } else {
                Alert.alert("✅", res.message);
                navigation.goBack();
            }
        },
        onError: () => {
            Alert.alert("Lỗi", "Không thể nâng cấp. Vui lòng thử lại.");
        },
    });

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Close */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.closeBtnText}>✕ Đóng</Text>
            </TouchableOpacity>

            {/* Hero */}
            <View style={styles.hero}>
                <Text style={styles.heroIcon}>⭐</Text>
                <Text style={styles.heroTitle}>DICO Premium</Text>
                <Text style={styles.heroSubtitle}>
                    Bảo vệ sức khỏe của bạn và gia đình với sức mạnh AI cá nhân hóa
                </Text>
            </View>

            {/* Benefits List */}
            <View style={styles.benefitsList}>
                {PREMIUM_BENEFITS.map((b, i) => (
                    <View key={i} style={styles.benefitItem}>
                        <Text style={styles.benefitIcon}>{b.icon}</Text>
                        <View style={styles.benefitText}>
                            <Text style={styles.benefitTitle}>{b.title}</Text>
                            <Text style={styles.benefitDesc}>{b.desc}</Text>
                        </View>
                    </View>
                ))}
            </View>

            {/* Compare FREE vs PREMIUM */}
            <View style={styles.compareCard}>
                <Text style={styles.compareTitle}>So sánh gói</Text>
                <View style={styles.compareRow}>
                    <Text style={styles.compareFeature}>Quét sản phẩm</Text>
                    <Text style={styles.compareFree}>✅ FREE</Text>
                    <Text style={styles.comparePrem}>✅ PREMIUM</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareRow}>
                    <Text style={styles.compareFeature}>Cảnh báo dị ứng</Text>
                    <Text style={styles.compareFree}>❌</Text>
                    <Text style={styles.comparePrem}>✅</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareRow}>
                    <Text style={styles.compareFeature}>Hồ sơ an toàn</Text>
                    <Text style={styles.compareFree}>❌</Text>
                    <Text style={styles.comparePrem}>✅</Text>
                </View>
                <View style={styles.compareDivider} />
                <View style={styles.compareRow}>
                    <Text style={styles.compareFeature}>AI cá nhân hóa</Text>
                    <Text style={styles.compareFree}>❌</Text>
                    <Text style={styles.comparePrem}>✅</Text>
                </View>
            </View>

            {/* CTA Button */}
            <TouchableOpacity
                style={[styles.upgradeBtn, mutation.isPending && styles.upgradeBtnDisabled]}
                onPress={() => mutation.mutate()}
                disabled={mutation.isPending}
                activeOpacity={0.85}
            >
                <Text style={styles.upgradeBtnText}>
                    {mutation.isPending ? "Đang xử lý..." : "⭐ Nâng cấp PREMIUM ngay"}
                </Text>
            </TouchableOpacity>

            <Text style={styles.devNote}>
                🧪 Dev mode — nâng cấp ngay lập tức không cần thanh toán
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 24, paddingBottom: 48 },

    closeBtn: { alignSelf: "flex-end" },
    closeBtnText: { color: COLORS.textMuted, fontSize: 14 },

    hero: { alignItems: "center", paddingVertical: 32 },
    heroIcon: { fontSize: 56, marginBottom: 12 },
    heroTitle: { color: COLORS.text, fontSize: 32, fontWeight: "800", letterSpacing: 1, marginBottom: 10 },
    heroSubtitle: { color: COLORS.textMuted, fontSize: 15, textAlign: "center", lineHeight: 22 },

    benefitsList: { gap: 0, marginBottom: 24 },
    benefitItem: { flexDirection: "row", alignItems: "flex-start", gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    benefitIcon: { fontSize: 28, marginTop: 2 },
    benefitText: { flex: 1 },
    benefitTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginBottom: 4 },
    benefitDesc: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },

    compareCard: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 24 },
    compareTitle: { color: COLORS.text, fontSize: 16, fontWeight: "700", marginBottom: 14, textAlign: "center" },
    compareRow: { flexDirection: "row", alignItems: "center", paddingVertical: 6 },
    compareFeature: { flex: 2, color: COLORS.textMuted, fontSize: 13 },
    compareFree: { flex: 1, color: COLORS.textMuted, fontSize: 13, textAlign: "center" },
    comparePrem: { flex: 1, color: "#86EFAC", fontSize: 13, textAlign: "center", fontWeight: "700" },
    compareDivider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },

    upgradeBtn: {
        backgroundColor: COLORS.primary,
        padding: 18,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 6,
    },
    upgradeBtnDisabled: { opacity: 0.6 },
    upgradeBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "800", letterSpacing: 0.3 },

    devNote: { color: COLORS.textMuted, fontSize: 11, textAlign: "center", marginTop: 16, fontStyle: "italic" },
});
