// src/screens/StatsScreen.tsx
// Dashboard thống kê cá nhân — tổng quan an toàn thực phẩm

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";
import { getUserStats } from "@/api/stats";

const DAY_NAMES = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

/** Animated safety score ring (pure RN, no SVG lib) */
function SafetyRing({ score }: { score: number }) {
    const color = score >= 70 ? "#22C55E" : score >= 40 ? "#EAB308" : "#EF4444";
    const label = score >= 70 ? "Tốt" : score >= 40 ? "Trung bình" : "Kém";
    return (
        <View style={ringStyles.container}>
            <View style={[ringStyles.ring, { borderColor: color }]}>
                <Text style={[ringStyles.score, { color }]}>{score}</Text>
                <Text style={[ringStyles.label, { color }]}>{label}</Text>
            </View>
            <Text style={ringStyles.caption}>Điểm An Toàn</Text>
        </View>
    );
}

const ringStyles = StyleSheet.create({
    container: { alignItems: "center", marginVertical: 24 },
    ring: { width: 130, height: 130, borderRadius: 65, borderWidth: 6, justifyContent: "center", alignItems: "center" },
    score: { fontSize: 38, fontWeight: "800" },
    label: { fontSize: 13, fontWeight: "600" },
    caption: { color: COLORS.textMuted, fontSize: 12, marginTop: 8 },
});

/** Horizontal bar chart per color rating */
function ColorBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
    const pct = total > 0 ? Math.round((count / total) * 100) : 0;
    return (
        <View style={barStyles.row}>
            <Text style={barStyles.label}>{label}</Text>
            <View style={barStyles.track}>
                <View style={[barStyles.fill, { width: `${pct}%`, backgroundColor: color }]} />
            </View>
            <Text style={barStyles.count}>{count} ({pct}%)</Text>
        </View>
    );
}

const barStyles = StyleSheet.create({
    row: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
    label: { width: 70, color: COLORS.textMuted, fontSize: 12 },
    track: { flex: 1, height: 10, backgroundColor: COLORS.surface, borderRadius: 5, overflow: "hidden", marginHorizontal: 10 },
    fill: { height: "100%", borderRadius: 5 },
    count: { width: 72, color: COLORS.text, fontSize: 11, textAlign: "right" },
});

export default function StatsScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const { isAuthenticated } = useAuthStore();

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: ["userStats"],
        queryFn: getUserStats,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 2, // 2 minutes
    });

    if (!isAuthenticated) {
        return (
            <View style={styles.center}>
                <Text style={styles.lockEmoji}>🔒</Text>
                <Text style={styles.lockTitle}>Đăng nhập để xem</Text>
                <Text style={styles.muted}>Thống kê cá nhân yêu cầu tài khoản</Text>
            </View>
        );
    }

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>Đang tải thống kê...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorEmoji}>😕</Text>
                <Text style={styles.muted}>Không thể tải thống kê</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!data || data.totalScanned === 0) {
        return (
            <View style={styles.center}>
                <Text style={{ fontSize: 48 }}>📊</Text>
                <Text style={styles.lockTitle}>Chưa có dữ liệu</Text>
                <Text style={styles.muted}>Hãy quét sản phẩm đầu tiên để thấy thống kê!</Text>
                <TouchableOpacity
                    style={styles.retryBtn}
                    onPress={() => navigation.navigate("Tabs")}
                >
                    <Text style={styles.retryText}>Quét ngay</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Title */}
            <Text style={styles.title}>📊 Thống kê cá nhân</Text>
            <Text style={styles.subtitle}>
                Dựa trên {data.totalScanned} lần quét sản phẩm
            </Text>

            {/* Safety Score Ring */}
            <View style={styles.card}>
                <SafetyRing score={data.safetyScore} />
                <Text style={styles.scoreHint}>
                    {data.safetyScore >= 70
                        ? "Bạn đang chọn thực phẩm an toàn 👍"
                        : data.safetyScore >= 40
                            ? "Hãy chú ý hơn đến thành phần 🧐"
                            : "Nhiều sản phẩm nguy hiểm trong lịch sử ⚠️"}
                </Text>
            </View>

            {/* Color Distribution */}
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Phân bố mức độ an toàn</Text>
                <ColorBar label="🟢 An toàn" count={data.greenCount} total={data.totalScanned} color="#22C55E" />
                <ColorBar label="🟡 Chú ý" count={data.yellowCount} total={data.totalScanned} color="#EAB308" />
                <ColorBar label="🔴 Nguy hiểm" count={data.redCount} total={data.totalScanned} color="#EF4444" />
                {data.unknownCount > 0 && (
                    <ColorBar label="⚪ Không rõ" count={data.unknownCount} total={data.totalScanned} color={COLORS.textMuted} />
                )}
            </View>

            {/* Summary Cards */}
            <View style={styles.summaryRow}>
                <View style={styles.summaryCard}>
                    <Text style={styles.summaryValue}>{data.totalScanned}</Text>
                    <Text style={styles.summaryLabel}>Tổng quét</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={[styles.summaryValue, { color: "#22C55E" }]}>{data.greenPercent}%</Text>
                    <Text style={styles.summaryLabel}>An toàn</Text>
                </View>
                <View style={styles.summaryCard}>
                    <Text style={[styles.summaryValue, { color: "#EF4444" }]}>{data.redPercent}%</Text>
                    <Text style={styles.summaryLabel}>Nguy hiểm</Text>
                </View>
            </View>

            {/* Last Scanned */}
            {data.lastScannedBarcode && (
                <TouchableOpacity
                    style={styles.lastCard}
                    onPress={() => navigation.navigate("Result", { barcode: data.lastScannedBarcode! })}
                    activeOpacity={0.8}
                >
                    <Text style={styles.lastTitle}>🕐 Quét gần nhất</Text>
                    <Text style={styles.lastBarcode}>{data.lastScannedBarcode}</Text>
                    <Text style={styles.lastHint}>Nhấn để xem lại →</Text>
                </TouchableOpacity>
            )}

            {/* Navigate to favorites */}
            <TouchableOpacity
                style={styles.favBtn}
                onPress={() => navigation.navigate("Favorites")}
            >
                <Text style={styles.favBtnText}>⭐ Xem danh sách yêu thích</Text>
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 12, padding: 32 },

    title: { color: COLORS.text, fontSize: 24, fontWeight: "800", marginBottom: 4 },
    subtitle: { color: COLORS.textMuted, fontSize: 13, marginBottom: 20 },

    card: { backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16 },
    cardTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700", marginBottom: 16 },
    scoreHint: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginTop: -8 },

    summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
    summaryCard: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 14, padding: 14, alignItems: "center" },
    summaryValue: { color: COLORS.text, fontSize: 26, fontWeight: "800", marginBottom: 4 },
    summaryLabel: { color: COLORS.textMuted, fontSize: 11 },

    lastCard: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, marginBottom: 16, flexDirection: "column", gap: 4 },
    lastTitle: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
    lastBarcode: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
    lastHint: { color: COLORS.primary, fontSize: 12 },

    favBtn: { backgroundColor: COLORS.surface, borderRadius: 14, padding: 16, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
    favBtnText: { color: COLORS.text, fontSize: 15, fontWeight: "600" },

    lockEmoji: { fontSize: 48 },
    lockTitle: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
    muted: { color: COLORS.textMuted, fontSize: 14, textAlign: "center" },
    errorEmoji: { fontSize: 40 },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    retryText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
});
