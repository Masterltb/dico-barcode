// src/screens/ResultScreen.tsx
// GUARDRAIL (RULE_MOB_01): This screen reads `rating` from API response.
// It NEVER calculates or derives rating color from `score`.

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { useProduct } from "@/hooks/useProduct";
import { StandardError } from "@/api/types";

type Props = NativeStackScreenProps<RootStackParamList, "Result">;

export default function ResultScreen({ route, navigation }: Props) {
    const { barcode } = route.params;
    const { data: product, isLoading, error, refetch } = useProduct(barcode);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>Đang phân tích sản phẩm...</Text>
            </View>
        );
    }

    if (error) {
        const err = error as StandardError;
        const isNotFound = err.errorCode === "PRODUCT_NOT_FOUND";

        if (isNotFound) {
            // Navigate to ContributeScreen on 404
            navigation.replace("Contribute", { barcode });
            return null;
        }

        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>⚠️ {err.message}</Text>
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
            {/* Close button */}
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.closeBtnText}>✕ Đóng</Text>
            </TouchableOpacity>

            {/* Product Header */}
            <View style={styles.header}>
                {product.imageUrl ? (
                    <Image source={{ uri: product.imageUrl }} style={styles.productImage} />
                ) : (
                    <View style={styles.imagePlaceholder}>
                        <Text style={{ fontSize: 32 }}>📦</Text>
                    </View>
                )}
                <Text style={styles.productName}>{product.name ?? "Tên không xác định"}</Text>
                <Text style={styles.brand}>{product.brand ?? ""}</Text>
                <Text style={styles.barcode}>#{product.barcode}</Text>
            </View>

            {/* Rating Badge — reads from API, never computes */}
            <View style={[styles.ratingCard, { backgroundColor: ratingStyle.bg }]}>
                <Text style={styles.ratingLabel}>{ratingStyle.label}</Text>
                <Text style={styles.ratingDescription}>{ratingStyle.description}</Text>
                {product.score !== null && (
                    <Text style={styles.score}>Điểm: {product.score}/100</Text>
                )}
            </View>

            {/* Override Warning — MUST show when overrideReasons is non-empty */}
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

            {/* Confidence */}
            <Text style={styles.confidence}>
                Độ tin cậy: {Math.round(product.confidenceScore * 100)}%
            </Text>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    content: { padding: 20, paddingBottom: 40 },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 16, padding: 24 },
    closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
    closeBtnText: { color: COLORS.textMuted, fontSize: 14 },
    header: { alignItems: "center", marginBottom: 20 },
    productImage: { width: 100, height: 100, borderRadius: 12, marginBottom: 12 },
    imagePlaceholder: { width: 100, height: 100, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginBottom: 12 },
    productName: { color: COLORS.text, fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 4 },
    brand: { color: COLORS.textMuted, fontSize: 14, marginBottom: 4 },
    barcode: { color: COLORS.textMuted, fontSize: 12 },
    ratingCard: { borderRadius: 16, padding: 20, alignItems: "center", marginBottom: 16 },
    ratingLabel: { color: COLORS.white, fontSize: 28, fontWeight: "800", marginBottom: 4 },
    ratingDescription: { color: COLORS.white, fontSize: 14, opacity: 0.9, marginBottom: 8 },
    score: { color: COLORS.white, fontSize: 18, fontWeight: "600" },
    overrideCard: { backgroundColor: "#450A0A", borderWidth: 1, borderColor: COLORS.danger, borderRadius: 12, padding: 16, marginBottom: 16 },
    overrideTitle: { color: COLORS.danger, fontSize: 15, fontWeight: "700", marginBottom: 8 },
    overrideReason: { color: "#FCA5A5", fontSize: 14, marginBottom: 4 },
    aiCard: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 16, marginBottom: 16 },
    aiTitle: { color: COLORS.primary, fontSize: 14, fontWeight: "600", marginBottom: 8 },
    aiSummary: { color: COLORS.text, fontSize: 14, lineHeight: 22 },
    confidence: { color: COLORS.textMuted, fontSize: 12, textAlign: "center" },
    errorText: { color: COLORS.danger, fontSize: 16, textAlign: "center" },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
    retryText: { color: COLORS.white, fontWeight: "600" },
    muted: { color: COLORS.textMuted, fontSize: 14 },
});
