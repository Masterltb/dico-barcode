// src/screens/ResultScreen.tsx
// GUARDRAIL (RULE_MOB_01): This screen reads `rating` from API response.
// It NEVER calculates or derives rating color from `score`.

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    ScrollView,
    Share,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { useProduct } from "@/hooks/useProduct";
import { StandardError } from "@/api/types";
import { getFavoriteStatus, upsertFavorite, removeFavorite } from "@/api/stats";
import { useAuthStore } from "@/store/authStore";
import { AlternativesSection } from "@/components/AlternativesSection";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export default function ResultScreen({ route, navigation }: Props) {
    const { barcode } = route.params;
    const { data: product, isLoading, error, refetch } = useProduct(barcode);
    const [ingredientsExpanded, setIngredientsExpanded] = useState(false);
    const { isAuthenticated } = useAuthStore();
    const queryClient = useQueryClient();

    // ── Favorite state ────────────────────────────────────────────
    const { data: favStatus } = useQuery({
        queryKey: ["favoriteStatus", barcode],
        queryFn: () => getFavoriteStatus(barcode),
        enabled: isAuthenticated,
        staleTime: 1000 * 30,
    });

    const upsertMutation = useMutation({
        mutationFn: ({ label }: { label: "SAFE" | "AVOID" }) => upsertFavorite(barcode, label),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favoriteStatus", barcode] }),
    });
    const removeMutation = useMutation({
        mutationFn: () => removeFavorite(barcode),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ["favoriteStatus", barcode] }),
    });

    const handleFavoritePress = () => {
        if (!isAuthenticated) { Alert.alert("Cần đăng nhập", "Đăng nhập để lưu yêu thích"); return; }
        if (favStatus?.isFavorited) {
            Alert.alert("Yêu thích", "Chọn hành động", [
                { text: "Hủy", style: "cancel" },
                { text: "✅ Mua lại", onPress: () => upsertMutation.mutate({ label: "SAFE" }) },
                { text: "🚫 Tránh mua", onPress: () => upsertMutation.mutate({ label: "AVOID" }) },
                { text: "Xóa khỏi yêu thích", style: "destructive", onPress: () => removeMutation.mutate() },
            ]);
        } else {
            Alert.alert("Thêm yêu thích", "Đánh dấu sản phẩm này là:", [
                { text: "Hủy", style: "cancel" },
                { text: "✅ Mua lại", onPress: () => upsertMutation.mutate({ label: "SAFE" }) },
                { text: "🚫 Tránh mua", onPress: () => upsertMutation.mutate({ label: "AVOID" }) },
            ]);
        }
    };

    // ── Share handler ─────────────────────────────────────────────
    const handleShare = async () => {
        if (!product) return;
        const ratingLabel = RATING_COLORS[product.rating]?.label ?? product.rating;
        const name = product.name ?? product.barcode;
        const emoji = product.rating === "GREEN" ? "🟢" : product.rating === "RED" ? "🔴" : "🟡";
        try {
            await Share.share({
                message:
                    `${emoji} Tôi vừa quét "${name}" trên DICO Scan\n\n` +
                    `Đánh giá: ${ratingLabel}\n` +
                    (product.aiSummary ? `\n${product.aiSummary}\n\n` : "\n") +
                    `📱 Tải DICO Scan để quét sản phẩm an toàn!`,
                title: `Kết quả quét — ${name}`,
            });
        } catch {
            // User cancelled share — no-op
        }
    };

    // ── Loading/Error states ──────────────────────────────────────
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>Đang phân tích sản phẩm...</Text>
            </View>
        );
    }

    if (error) {
        const isStandardError = (e: unknown): e is StandardError =>
            typeof e === "object" && e !== null && "errorCode" in e;
        const isNotFound = isStandardError(error) && error.errorCode === "PRODUCT_NOT_FOUND";

        if (isNotFound) {
            navigation.replace("Contribute", { barcode });
            return null;
        }
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>⚠️ {isStandardError(error) ? error.message : "Đã xảy ra lỗi"}</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.muted}>← Quay lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!product) return null;

    const ratingStyle = RATING_COLORS[product.rating];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header row */}
            <View style={styles.topRow}>
                <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                    <Text style={styles.closeBtnText}>← Quay lại</Text>
                </TouchableOpacity>
                <View style={styles.headerActions}>
                    <TouchableOpacity
                        style={[styles.favBtn, favStatus?.isFavorited && styles.favBtnActive]}
                        onPress={handleFavoritePress}
                    >
                        <Text style={styles.favBtnText}>
                            {favStatus?.isFavorited
                                ? (favStatus.label === "SAFE" ? "✅" : "🚫")
                                : "⭐"}
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
                        <Text style={styles.shareBtnText}>📤 Chia sẻ</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Product Header */}
            <View style={styles.header}>
                {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={{ fontSize: 36 }}>
                            {product.category === "BEAUTY" ? "💄" : product.category === "TOY" ? "🧸" : "📦"}
                        </Text>
                    </View>
                )}
                <Text style={styles.productName}>{product.name ?? "Tên không xác định"}</Text>
                {product.brand && <Text style={styles.brand}>{product.brand}</Text>}
                <Text style={styles.barcode}>#{product.barcode}</Text>
                {product.category && product.category !== "FOOD" && (
                    <View style={styles.categoryChip}>
                        <Text style={styles.categoryChipText}>{product.category}</Text>
                    </View>
                )}
            </View>

            {/* Rating Badge */}
            <View style={[styles.ratingCard, { backgroundColor: ratingStyle.bg }]}>
                <Text style={styles.ratingLabel}>{ratingStyle.label}</Text>
                <Text style={styles.ratingDescription}>{ratingStyle.description}</Text>
                {product.score !== null && (
                    <Text style={styles.score}>Điểm: {product.score}/100</Text>
                )}
                {product.confidenceScore < 0.7 && (
                    <Text style={styles.lowConfidence}>
                        ⚠️ Dữ liệu chưa đầy đủ (độ tin cậy {Math.round(product.confidenceScore * 100)}%)
                    </Text>
                )}
            </View>

            {/* Category Warning */}
            {product.categoryWarning && (
                <View style={styles.categoryWarningCard}>
                    <Text style={styles.categoryWarningText}>{product.categoryWarning}</Text>
                </View>
            )}

            {/* Override Warning */}
            {product.overrideReasons && product.overrideReasons.length > 0 && (
                <View style={styles.overrideCard}>
                    <Text style={styles.overrideTitle}>⚠️ Cảnh báo ưu tiên</Text>
                    {product.overrideReasons.map((reason, i) => (
                        <Text key={i} style={styles.overrideReason}>• {reason}</Text>
                    ))}
                </View>
            )}

            {/* AI Summary */}
            <View style={styles.aiCard}>
                <Text style={styles.aiTitle}>✨ Tóm tắt AI</Text>
                <Text style={styles.aiSummary}>
                    {product.aiSummary ?? "Đang phân tích thành phần sản phẩm..."}
                </Text>
            </View>

            {/* Ingredients — Expandable */}
            {product.ingredientsText && (
                <TouchableOpacity
                    style={styles.ingredientsCard}
                    onPress={() => setIngredientsExpanded((v) => !v)}
                    activeOpacity={0.8}
                >
                    <View style={styles.ingredientsHeader}>
                        <Text style={styles.ingredientsTitle}>📋 Thành phần</Text>
                        <Text style={styles.expandIcon}>{ingredientsExpanded ? "▲" : "▼"}</Text>
                    </View>
                    {ingredientsExpanded && (
                        <Text style={styles.ingredientsText}>{product.ingredientsText}</Text>
                    )}
                    {!ingredientsExpanded && (
                        <Text style={styles.ingredientsPreview} numberOfLines={2}>
                            {product.ingredientsText}
                        </Text>
                    )}
                </TouchableOpacity>
            )}

            {/* Confidence */}
            {product.confidenceScore >= 0.7 && (
                <Text style={styles.confidence}>
                    Độ tin cậy: {Math.round(product.confidenceScore * 100)}%
                </Text>
            )}

            {/* Alternatives — only for YELLOW/RED products */}
            <AlternativesSection
                barcode={barcode}
                currentRating={product.rating}
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 16, padding: 24 },

    topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
    closeBtn: { padding: 4 },
    closeBtnText: { color: COLORS.textMuted, fontSize: 15 },
    shareBtn: { backgroundColor: COLORS.surface, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
    shareBtnText: { color: COLORS.text, fontSize: 13, fontWeight: "600" },

    header: { alignItems: "center", marginBottom: 20 },
    productImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 12 },
    imagePlaceholder: { width: 100, height: 100, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    productName: { color: COLORS.text, fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 4 },
    brand: { color: COLORS.textMuted, fontSize: 13, marginBottom: 4 },
    barcode: { color: COLORS.textMuted, fontSize: 12 },
    categoryChip: { marginTop: 8, backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: COLORS.border },
    categoryChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", letterSpacing: 0.5 },

    ratingCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 12 },
    ratingLabel: { color: COLORS.white, fontSize: 26, fontWeight: "800", marginBottom: 4 },
    ratingDescription: { color: COLORS.white, fontSize: 13, opacity: 0.9, marginBottom: 6 },
    score: { color: COLORS.white, fontSize: 18, fontWeight: "600" },
    lowConfidence: { color: COLORS.white, fontSize: 12, opacity: 0.85, marginTop: 6, textAlign: "center" },

    categoryWarningCard: { backgroundColor: COLORS.surface, borderRadius: 10, padding: 12, marginBottom: 12, borderLeftWidth: 3, borderLeftColor: COLORS.warning },
    categoryWarningText: { color: COLORS.text, fontSize: 13, lineHeight: 20 },

    overrideCard: { backgroundColor: "#450A0A", borderWidth: 1, borderColor: COLORS.danger, borderRadius: 12, padding: 16, marginBottom: 12 },
    overrideTitle: { color: COLORS.danger, fontSize: 15, fontWeight: "700", marginBottom: 8 },
    overrideReason: { color: "#FCA5A5", fontSize: 14, marginBottom: 4 },

    aiCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
    aiTitle: { color: COLORS.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
    aiSummary: { color: COLORS.text, fontSize: 14, lineHeight: 22 },

    ingredientsCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 12 },
    ingredientsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
    ingredientsTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
    expandIcon: { color: COLORS.textMuted, fontSize: 12 },
    ingredientsText: { color: COLORS.textMuted, fontSize: 13, lineHeight: 20 },
    ingredientsPreview: { color: COLORS.textMuted, fontSize: 13, lineHeight: 18 },

    confidence: { color: COLORS.textMuted, fontSize: 12, textAlign: "center" },
    errorText: { color: COLORS.danger, fontSize: 16, textAlign: "center" },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: COLORS.white, fontWeight: "600" },
    muted: { color: COLORS.textMuted, fontSize: 14 },

    // Header action row
    headerActions: { flexDirection: "row", gap: 8, alignItems: "center" },
    favBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
    favBtnActive: { backgroundColor: "#1E1B4B", borderColor: COLORS.primary },
    favBtnText: { fontSize: 18 },
});
