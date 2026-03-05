// src/screens/CompareScreen.tsx
// So sánh 2 sản phẩm side-by-side

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Image,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { getProduct } from "@/api/products";
import { queryKeys } from "@/constants/queryKeys";
import { ProductEvaluationResponse } from "@/api/types";

type Props = NativeStackScreenProps<RootStackParamList, "Compare">;

const SCORE_EMOJI = (score: number | null) => {
    if (score === null) return "—";
    if (score >= 70) return `${score} 🟢`;
    if (score >= 40) return `${score} 🟡`;
    return `${score} 🔴`;
};

function ProductColumn({
    barcode,
    label,
}: {
    barcode: string | undefined;
    label: string;
}) {
    const [inputBarcode, setInputBarcode] = useState(barcode ?? "");
    const [confirmedBarcode, setConfirmedBarcode] = useState(barcode ?? "");

    const { data, isLoading, error } = useQuery({
        queryKey: confirmedBarcode ? queryKeys.product(confirmedBarcode) : ["empty"],
        queryFn: () => getProduct(confirmedBarcode),
        enabled: !!confirmedBarcode,
        staleTime: 1000 * 60 * 5,
    });

    const ratingStyle = data ? RATING_COLORS[data.rating] : null;

    return (
        <View style={colStyles.container}>
            {/* Label */}
            <Text style={colStyles.label}>{label}</Text>

            {/* Barcode Input */}
            <View style={colStyles.inputRow}>
                <TextInput
                    style={colStyles.input}
                    value={inputBarcode}
                    onChangeText={setInputBarcode}
                    placeholder="Nhập barcode..."
                    placeholderTextColor={COLORS.textMuted}
                    keyboardType="numeric"
                    maxLength={14}
                    onSubmitEditing={() => setConfirmedBarcode(inputBarcode.trim())}
                    returnKeyType="search"
                />
                <TouchableOpacity
                    style={colStyles.loadBtn}
                    onPress={() => setConfirmedBarcode(inputBarcode.trim())}
                >
                    <Text style={colStyles.loadBtnText}>↵</Text>
                </TouchableOpacity>
            </View>

            {/* Loading */}
            {isLoading && confirmedBarcode && (
                <View style={colStyles.stateBox}>
                    <ActivityIndicator color={COLORS.primary} size="small" />
                </View>
            )}

            {/* Error */}
            {error && !isLoading && (
                <View style={colStyles.stateBox}>
                    <Text style={colStyles.errorText}>Không tìm thấy</Text>
                </View>
            )}

            {/* Product Card */}
            {data && !isLoading && (
                <View style={colStyles.card}>
                    {data.imageUrl ? (
                        <Image source={{ uri: data.imageUrl }} style={colStyles.image} />
                    ) : (
                        <View style={colStyles.imagePlaceholder}>
                            <Text style={{ fontSize: 28 }}>📦</Text>
                        </View>
                    )}
                    <Text style={colStyles.name} numberOfLines={2}>{data.name ?? "—"}</Text>
                    <Text style={colStyles.brand} numberOfLines={1}>{data.brand ?? ""}</Text>

                    {/* Rating card */}
                    <View style={[colStyles.ratingBadge, { backgroundColor: ratingStyle?.bg }]}>
                        <Text style={colStyles.ratingLabel}>{ratingStyle?.label}</Text>
                    </View>

                    {/* Score */}
                    <Text style={colStyles.dataRow}>Điểm: {SCORE_EMOJI(data.score)}</Text>

                    {/* Allergen warnings */}
                    {data.overrideReasons && data.overrideReasons.length > 0 && (
                        <View style={colStyles.warningBox}>
                            <Text style={colStyles.warningTitle}>⚠️ Cảnh báo</Text>
                            {data.overrideReasons.slice(0, 2).map((r, i) => (
                                <Text key={i} style={colStyles.warningText} numberOfLines={2}>• {r}</Text>
                            ))}
                        </View>
                    )}

                    {/* AI summary */}
                    <Text style={colStyles.aiSummary} numberOfLines={4}>
                        {data.aiSummary ?? "Đang phân tích..."}
                    </Text>
                </View>
            )}
        </View>
    );
}

export default function CompareScreen({ route, navigation }: Props) {
    const { barcode1 } = route.params;

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Text style={styles.backBtn}>← Quay lại</Text>
                </TouchableOpacity>
                <Text style={styles.title}>⚖️ So sánh</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <Text style={styles.hint}>
                    Nhập barcode vào ô bên dưới để so sánh 2 sản phẩm
                </Text>

                <View style={styles.columns}>
                    <ProductColumn barcode={barcode1} label="Sản phẩm A" />
                    <View style={styles.divider} />
                    <ProductColumn barcode={undefined} label="Sản phẩm B" />
                </View>
            </ScrollView>
        </View>
    );
}

// ── Column Styles ─────────────────────────────────────────────────
const colStyles = StyleSheet.create({
    container: { flex: 1, paddingVertical: 8 },
    label: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", letterSpacing: 1, textAlign: "center", marginBottom: 8, textTransform: "uppercase" },
    inputRow: { flexDirection: "row", gap: 6, marginBottom: 10 },
    input: { flex: 1, backgroundColor: COLORS.surface, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, color: COLORS.text, fontSize: 13, borderWidth: 1, borderColor: COLORS.border },
    loadBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 12, justifyContent: "center" },
    loadBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
    stateBox: { alignItems: "center", paddingVertical: 20 },
    errorText: { color: COLORS.danger, fontSize: 13 },
    card: { backgroundColor: COLORS.surface, borderRadius: 12, padding: 12, gap: 8 },
    image: { width: "100%", height: 80, borderRadius: 8, resizeMode: "contain" },
    imagePlaceholder: { width: "100%", height: 80, backgroundColor: COLORS.background, borderRadius: 8, justifyContent: "center", alignItems: "center" },
    name: { color: COLORS.text, fontSize: 13, fontWeight: "700", textAlign: "center" },
    brand: { color: COLORS.textMuted, fontSize: 11, textAlign: "center" },
    ratingBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, alignItems: "center" },
    ratingLabel: { color: COLORS.white, fontSize: 13, fontWeight: "800" },
    dataRow: { color: COLORS.textMuted, fontSize: 12, textAlign: "center" },
    warningBox: { backgroundColor: "#450A0A", borderRadius: 8, padding: 8 },
    warningTitle: { color: COLORS.danger, fontSize: 11, fontWeight: "700", marginBottom: 4 },
    warningText: { color: "#FCA5A5", fontSize: 11 },
    aiSummary: { color: COLORS.textMuted, fontSize: 12, lineHeight: 18, fontStyle: "italic" },
});

// ── Screen Styles ─────────────────────────────────────────────────
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    backBtn: { color: COLORS.textMuted, fontSize: 14, width: 80 },
    title: { color: COLORS.text, fontSize: 18, fontWeight: "700" },
    content: { padding: 16, paddingBottom: 40 },
    hint: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", marginBottom: 16 },
    columns: { flexDirection: "row", gap: 12 },
    divider: { width: 1, backgroundColor: COLORS.border },
});
