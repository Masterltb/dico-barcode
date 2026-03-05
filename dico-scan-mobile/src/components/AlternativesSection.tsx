// src/components/AlternativesSection.tsx
// Hiển thị danh sách sản phẩm thay thế tốt hơn (cuộn ngang).
// DB results (đã xác minh) + AI suggestions (gợi ý tên/thương hiệu).

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import React from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { useAlternatives, AlternativeProduct } from "@/hooks/useAlternatives";
import { RootStackParamList } from "@/navigation/RootNavigator";

const RATING_BADGE: Record<string, { bg: string; label: string }> = {
    GREEN: { bg: "#166534", label: "🟢 An toàn" },
    YELLOW: { bg: "#854D0E", label: "🟡 Chú ý" },
};

interface Props {
    barcode: string;
    currentRating: string;
}

/**
 * Horizontal scroll section showing better alternative products.
 * Rendered only when product rating is YELLOW or RED.
 *
 * Card types:
 *   DB source   → real product with barcode → tappable → ResultScreen
 *   AI source   → text-only suggestion      → tappable → ContributeScreen (invite scan)
 */
export function AlternativesSection({ barcode, currentRating }: Props) {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const shouldFetch = currentRating === "RED" || currentRating === "YELLOW";

    const { data: alternatives, isLoading } = useAlternatives(barcode, shouldFetch);

    if (!shouldFetch) return null;

    if (isLoading) {
        return (
            <View style={styles.container}>
                <Text style={styles.sectionTitle}>💡 Gợi ý thay thế tốt hơn</Text>
                <View style={styles.skeletonRow}>
                    {[0, 1, 2].map((i) => (
                        <View key={i} style={styles.skeleton} />
                    ))}
                </View>
            </View>
        );
    }

    if (!alternatives || alternatives.length === 0) return null;

    const handleCardPress = (item: AlternativeProduct) => {
        if (item.source === "DB" && item.barcode) {
            navigation.navigate("Result", { barcode: item.barcode });
        } else {
            // AI suggestion — invite user to contribute (scan the product)
            navigation.navigate("Contribute", { barcode: item.name });
        }
    };

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.sectionTitle}>💡 Sản phẩm thay thế tốt hơn</Text>
                <Text style={styles.sectionSubtitle}>{alternatives.length} gợi ý</Text>
            </View>

            {/* Horizontal scroll list */}
            <FlatList
                data={alternatives}
                keyExtractor={(item, idx) => item.barcode ?? `ai-${idx}`}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ width: 12 }} />}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, item.source === "AI" && styles.aiCard]}
                        onPress={() => handleCardPress(item)}
                        activeOpacity={0.8}
                    >
                        {/* Source badge */}
                        <View style={[styles.sourceBadge,
                        item.source === "AI" ? styles.aiBadge : styles.dbBadge]}>
                            <Text style={styles.sourceBadgeText}>
                                {item.source === "AI" ? "🤖 Gợi ý AI" : "✅ Đã xác minh"}
                            </Text>
                        </View>

                        {/* Product Image (DB only) */}
                        {item.imageUrl ? (
                            <Image
                                source={{ uri: item.imageUrl }}
                                style={styles.productImage}
                                resizeMode="contain"
                            />
                        ) : (
                            <View style={styles.noImage}>
                                <Text style={styles.noImageEmoji}>
                                    {item.source === "AI" ? "🤖" : "📦"}
                                </Text>
                            </View>
                        )}

                        {/* Product info */}
                        <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
                        <Text style={styles.brand} numberOfLines={1}>{item.brand}</Text>

                        {/* Rating badge (DB products only) */}
                        {item.score != null && item.rating in RATING_BADGE && (
                            <View style={[styles.ratingBadge,
                            { backgroundColor: RATING_BADGE[item.rating]?.bg ?? COLORS.surface }]}>
                                <Text style={styles.ratingText}>
                                    {RATING_BADGE[item.rating]?.label} · {item.score}/100
                                </Text>
                            </View>
                        )}

                        {/* Reason */}
                        <Text style={styles.reason} numberOfLines={2}>{item.reason}</Text>

                        {/* CTA */}
                        <View style={[styles.ctaBtn,
                        item.source === "AI" ? styles.ctaBtnAi : styles.ctaBtnDb]}>
                            <Text style={styles.ctaText}>
                                {item.source === "DB" ? "Xem chi tiết →" : "Tìm hiểu thêm →"}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />
        </View>
    );
}

const CARD_WIDTH = 175;

const styles = StyleSheet.create({
    container: { marginBottom: 16 },
    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 0, marginBottom: 10 },
    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "700" },
    sectionSubtitle: { color: COLORS.textMuted, fontSize: 12 },

    listContent: { paddingBottom: 4 },

    // Cards
    card: {
        width: CARD_WIDTH,
        backgroundColor: COLORS.surface,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    aiCard: {
        borderColor: "#6D28D9",
        borderStyle: "dashed",
        opacity: 0.92,
    },

    // Source badge
    sourceBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 8, alignSelf: "flex-start", marginBottom: 8 },
    dbBadge: { backgroundColor: "#14532D" },
    aiBadge: { backgroundColor: "#3B0764" },
    sourceBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: "700" },

    // Image
    productImage: { width: "100%", height: 80, borderRadius: 8, marginBottom: 8, backgroundColor: COLORS.background },
    noImage: { width: "100%", height: 80, borderRadius: 8, backgroundColor: COLORS.background, justifyContent: "center", alignItems: "center", marginBottom: 8 },
    noImageEmoji: { fontSize: 32 },

    // Text
    productName: { color: COLORS.text, fontSize: 12, fontWeight: "700", marginBottom: 2, lineHeight: 16 },
    brand: { color: COLORS.textMuted, fontSize: 10, marginBottom: 6 },

    // Rating
    ratingBadge: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, marginBottom: 6 },
    ratingText: { color: COLORS.white, fontSize: 9, fontWeight: "600" },

    // Reason
    reason: { color: COLORS.textMuted, fontSize: 10, lineHeight: 14, marginBottom: 8, flex: 1 },

    // CTA
    ctaBtn: { paddingVertical: 6, borderRadius: 8, alignItems: "center" },
    ctaBtnDb: { backgroundColor: COLORS.primary },
    ctaBtnAi: { backgroundColor: "#581C87" },
    ctaText: { color: COLORS.white, fontSize: 10, fontWeight: "700" },

    // Skeleton
    skeletonRow: { flexDirection: "row", gap: 12 },
    skeleton: { width: CARD_WIDTH, height: 200, backgroundColor: COLORS.surface, borderRadius: 14 },
});
