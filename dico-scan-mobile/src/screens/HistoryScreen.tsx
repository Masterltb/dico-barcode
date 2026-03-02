// src/screens/HistoryScreen.tsx

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { queryKeys } from "@/constants/queryKeys";
import { getScanHistory } from "@/api/products";
import { RatingColor, ScanHistoryItem } from "@/api/types";

type FilterType = "ALL" | RatingColor;
const FILTERS: FilterType[] = ["ALL", "GREEN", "YELLOW", "RED"];

export default function HistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [filter, setFilter] = useState<FilterType>("ALL");

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: queryKeys.history(0),
        queryFn: () => getScanHistory(0, 50),
    });

    const filtered =
        filter === "ALL"
            ? data ?? []
            : (data ?? []).filter((item) => item.snapshotColor === filter);

    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorText}>Không thể tải lịch sử</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>🕐 Lịch sử quét</Text>

            {/* Filter Bar */}
            <View style={styles.filterBar}>
                {FILTERS.map((f) => (
                    <TouchableOpacity
                        key={f}
                        style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === "ALL" ? "Tất cả" : f}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* History List */}
            <FlatList
                data={filtered}
                keyExtractor={(item, index) => `${item.barcode}-${index}`}
                renderItem={({ item }: { item: ScanHistoryItem }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate("Result", { barcode: item.barcode })}
                    >
                        <View
                            style={[
                                styles.colorDot,
                                { backgroundColor: RATING_COLORS[item.snapshotColor].bg },
                            ]}
                        />
                        <View style={styles.itemContent}>
                            <Text style={styles.itemName} numberOfLines={1}>
                                {item.name ?? item.barcode}
                            </Text>
                            <Text style={styles.itemDate}>
                                {new Date(item.scannedAt).toLocaleDateString("vi-VN")}
                            </Text>
                        </View>
                        <Text style={styles.itemArrow}>›</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={
                    <View style={styles.center}>
                        <Text style={styles.muted}>Chưa có lịch sử</Text>
                    </View>
                }
                contentContainerStyle={filtered.length === 0 ? { flex: 1 } : undefined}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 12 },
    title: { color: COLORS.text, fontSize: 22, fontWeight: "700", padding: 20, paddingBottom: 12 },
    filterBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 8 },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, backgroundColor: COLORS.surface },
    filterBtnActive: { backgroundColor: COLORS.primary },
    filterText: { color: COLORS.textMuted, fontSize: 13 },
    filterTextActive: { color: COLORS.white, fontWeight: "600" },
    item: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    colorDot: { width: 12, height: 12, borderRadius: 6, marginRight: 12 },
    itemContent: { flex: 1 },
    itemName: { color: COLORS.text, fontSize: 15, fontWeight: "500" },
    itemDate: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
    itemArrow: { color: COLORS.textMuted, fontSize: 18 },
    errorText: { color: COLORS.danger, fontSize: 15 },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 },
    retryText: { color: COLORS.white, fontWeight: "600" },
    muted: { color: COLORS.textMuted, fontSize: 14 },
});
