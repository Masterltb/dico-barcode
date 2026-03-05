// src/screens/HistoryScreen.tsx
// Lịch sử quét — với SearchBar + Filter + lịch sử gần nhất

import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import React, { useState, useCallback } from "react";
import {
    ActivityIndicator,
    FlatList,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { queryKeys } from "@/constants/queryKeys";
import { getScanHistory } from "@/api/products";
import { RatingColor, ScanHistoryItem } from "@/api/types";

type FilterType = "ALL" | RatingColor;
const FILTERS: { label: string; value: FilterType; emoji: string }[] = [
    { label: "Tất cả", value: "ALL", emoji: "" },
    { label: "An toàn", value: "GREEN", emoji: "🟢" },
    { label: "Chú ý", value: "YELLOW", emoji: "🟡" },
    { label: "Nguy hiểm", value: "RED", emoji: "🔴" },
];

const RATING_LABEL: Record<RatingColor, string> = {
    GREEN: "AN TOÀN",
    YELLOW: "CHÚ Ý",
    RED: "NGUY HIỂM",
    UNKNOWN: "KHÔNG RÕ",
};

export default function HistoryScreen() {
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
    const [filter, setFilter] = useState<FilterType>("ALL");
    const [searchText, setSearchText] = useState("");
    const [activeKeyword, setActiveKeyword] = useState<string | undefined>(undefined);

    // Debounce search — trigger khi user ngừng gõ 400ms
    const handleSearchChange = useCallback((text: string) => {
        setSearchText(text);
        // Clear filter về ALL khi search
        if (text.trim()) setFilter("ALL");
    }, []);

    const handleSearchSubmit = () => {
        setActiveKeyword(searchText.trim() || undefined);
    };

    const handleClearSearch = () => {
        setSearchText("");
        setActiveKeyword(undefined);
    };

    const { data, isLoading, error, refetch } = useQuery({
        queryKey: [...queryKeys.history(0), activeKeyword],
        queryFn: () => getScanHistory(0, 50, activeKeyword),
        staleTime: 1000 * 30,
    });

    const filtered =
        filter === "ALL"
            ? data ?? []
            : (data ?? []).filter((item) => item.snapshotColor === filter);

    // ── Loading ───────────────────────────────────────────────────
    if (isLoading) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} size="large" />
                <Text style={styles.muted}>Đang tải lịch sử...</Text>
            </View>
        );
    }

    // ── Error ──────────────────────────────────────────────────────
    if (error) {
        return (
            <View style={styles.center}>
                <Text style={styles.errorEmoji}>😕</Text>
                <Text style={styles.errorText}>Không thể tải lịch sử</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
                    <Text style={styles.retryText}>Thử lại</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>🕐 Lịch sử quét</Text>
                <Text style={styles.totalCount}>{data?.length ?? 0} sản phẩm</Text>
            </View>

            {/* SearchBar */}
            <View style={styles.searchContainer}>
                <View style={styles.searchBar}>
                    <Text style={styles.searchIcon}>🔍</Text>
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Tìm theo barcode..."
                        placeholderTextColor={COLORS.textMuted}
                        value={searchText}
                        onChangeText={handleSearchChange}
                        onSubmitEditing={handleSearchSubmit}
                        returnKeyType="search"
                        clearButtonMode="while-editing"
                        autoCapitalize="none"
                        autoCorrect={false}
                    />
                    {searchText.length > 0 && (
                        <TouchableOpacity onPress={handleClearSearch} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                            <Text style={styles.clearBtn}>✕</Text>
                        </TouchableOpacity>
                    )}
                </View>
                {searchText.trim() && searchText !== (activeKeyword ?? "") && (
                    <TouchableOpacity style={styles.searchSubmitBtn} onPress={handleSearchSubmit}>
                        <Text style={styles.searchSubmitText}>Tìm</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Active search indicator */}
            {activeKeyword && (
                <View style={styles.searchIndicator}>
                    <Text style={styles.searchIndicatorText}>
                        Kết quả cho: "{activeKeyword}" ({filtered.length} mục)
                    </Text>
                    <TouchableOpacity onPress={handleClearSearch}>
                        <Text style={styles.clearSearchLink}>Xóa tìm kiếm</Text>
                    </TouchableOpacity>
                </View>
            )}

            {/* Filter Bar — chỉ hiện khi không đang search */}
            {!activeKeyword && (
                <View style={styles.filterBar}>
                    {FILTERS.map((f) => (
                        <TouchableOpacity
                            key={f.value}
                            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
                            onPress={() => setFilter(f.value)}
                        >
                            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
                                {f.emoji ? `${f.emoji} ` : ""}{f.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}

            {/* History List */}
            <FlatList
                data={filtered}
                keyExtractor={(item) => item.scanId ?? item.barcode}
                renderItem={({ item }: { item: ScanHistoryItem }) => (
                    <TouchableOpacity
                        style={styles.item}
                        onPress={() => navigation.navigate("Result", { barcode: item.barcode })}
                        activeOpacity={0.7}
                    >
                        <View
                            style={[
                                styles.colorBar,
                                { backgroundColor: RATING_COLORS[item.snapshotColor]?.bg ?? COLORS.border },
                            ]}
                        />
                        <View style={styles.itemContent}>
                            <Text style={styles.itemBarcode}>{item.barcode}</Text>
                            <Text style={styles.itemDate}>
                                📅 {new Date(item.scannedAt).toLocaleDateString("vi-VN", {
                                    day: "2-digit", month: "2-digit", year: "numeric",
                                    hour: "2-digit", minute: "2-digit",
                                })}
                            </Text>
                        </View>

                        {/* Rating badge + Compare button */}
                        <View style={styles.itemActions}>
                            <View style={[styles.ratingBadge, { backgroundColor: RATING_COLORS[item.snapshotColor]?.bg ?? COLORS.border }]}>
                                <Text style={styles.ratingText}>{RATING_LABEL[item.snapshotColor] ?? "—"}</Text>
                            </View>
                            <TouchableOpacity
                                style={styles.compareBtn}
                                onPress={() => navigation.navigate("Compare", { barcode1: item.barcode })}
                            >
                                <Text style={styles.compareBtnText}>⚖️</Text>
                            </TouchableOpacity>
                        </View>
                        <Text style={styles.itemArrow}>›</Text>
                    </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={
                    <View style={styles.emptyState}>
                        <Text style={styles.emptyEmoji}>{activeKeyword ? "🔍" : "📭"}</Text>
                        <Text style={styles.emptyTitle}>
                            {activeKeyword ? "Không tìm thấy kết quả" : "Chưa có lịch sử"}
                        </Text>
                        <Text style={styles.emptyDesc}>
                            {activeKeyword
                                ? `Không có barcode chứa "${activeKeyword}"`
                                : filter !== "ALL"
                                    ? `Không có sản phẩm màu ${filter}`
                                    : "Quét sản phẩm đầu tiên của bạn!"}
                        </Text>
                    </View>
                }
                contentContainerStyle={filtered.length === 0 ? { flex: 1 } : { paddingBottom: 20 }}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 24 },
    muted: { color: COLORS.textMuted, fontSize: 14 },
    errorEmoji: { fontSize: 40 },
    errorText: { color: COLORS.danger, fontSize: 16, fontWeight: "600" },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 10 },
    retryText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },

    header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
    title: { color: COLORS.text, fontSize: 22, fontWeight: "700" },
    totalCount: { color: COLORS.textMuted, fontSize: 13 },

    // SearchBar
    searchContainer: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, marginBottom: 10, gap: 8 },
    searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: COLORS.surface, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
    searchIcon: { fontSize: 15 },
    searchInput: { flex: 1, color: COLORS.text, fontSize: 14 },
    clearBtn: { color: COLORS.textMuted, fontSize: 15, fontWeight: "600" },
    searchSubmitBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
    searchSubmitText: { color: COLORS.white, fontWeight: "600", fontSize: 14 },
    searchIndicator: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, marginBottom: 8 },
    searchIndicatorText: { color: COLORS.textMuted, fontSize: 12 },
    clearSearchLink: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

    // Filter bar
    filterBar: { flexDirection: "row", paddingHorizontal: 16, gap: 8, marginBottom: 10, flexWrap: "wrap" },
    filterBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border },
    filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
    filterText: { color: COLORS.textMuted, fontSize: 12 },
    filterTextActive: { color: COLORS.white, fontWeight: "600" },

    // List item
    item: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, backgroundColor: COLORS.surface, marginHorizontal: 12, borderRadius: 12 },
    colorBar: { width: 4, height: 40, borderRadius: 2, marginRight: 12 },
    itemContent: { flex: 1 },
    itemBarcode: { color: COLORS.text, fontSize: 14, fontWeight: "600", marginBottom: 4 },
    itemDate: { color: COLORS.textMuted, fontSize: 11 },
    itemActions: { alignItems: "flex-end", gap: 6 },
    ratingBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
    ratingText: { color: COLORS.white, fontSize: 9, fontWeight: "700", letterSpacing: 0.3 },
    compareBtn: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
    compareBtnText: { fontSize: 12 },
    itemArrow: { color: COLORS.textMuted, fontSize: 18, marginLeft: 6 },
    separator: { height: 8 },

    emptyState: { flex: 1, justifyContent: "center", alignItems: "center", gap: 10, padding: 40 },
    emptyEmoji: { fontSize: 48 },
    emptyTitle: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
    emptyDesc: { color: COLORS.textMuted, fontSize: 13, textAlign: "center" },
});
