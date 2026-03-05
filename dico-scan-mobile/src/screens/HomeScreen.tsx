// src/screens/HomeScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import React, { useCallback, useRef } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";
import { queryKeys } from "@/constants/queryKeys";
import { getScanHistory } from "@/api/products";
import { getPreferences } from "@/api/users";
import { useAuthStore } from "@/store/authStore";
import { ScanHistoryItem } from "@/api/types";

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

interface Props {
    navigation: HomeNavProp;
}

// RULE_MOB_06: Debounce 2 seconds between scans
const SCAN_DEBOUNCE_MS = 2000;

const COLOR_EMOJI: Record<string, string> = {
    GREEN: "🟢",
    YELLOW: "🟡",
    RED: "🔴",
    UNKNOWN: "⚪",
};

export default function HomeScreen({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = React.useState(false);
    const lastScanTime = useRef<number>(0);
    const { isAuthenticated } = useAuthStore();

    // Load 5 sản phẩm gần nhất từ server (chỉ khi đã đăng nhập)
    const { data: recentItems } = useQuery({
        queryKey: queryKeys.history(0),
        queryFn: () => getScanHistory(0, 5),
        enabled: isAuthenticated,
        staleTime: 1000 * 30,
    });

    // Load trạng thái allergy profile (tận dụng cache nếu PreferencesScreen đã load)
    const { data: preferences } = useQuery({
        queryKey: ["userPreferences"],
        queryFn: getPreferences,
        enabled: isAuthenticated,
        staleTime: 1000 * 60 * 5,
    });

    const isPremium = preferences?.subscriptionTier === "PREMIUM";
    const profileCompleted = preferences?.profileCompleted ?? false;
    const allergyCount = preferences?.allergies?.length ?? 0;

    const handleBarcodeScanned = useCallback(
        (result: BarcodeScanningResult) => {
            const barcode = result.data;
            const now = Date.now();
            if (now - lastScanTime.current < SCAN_DEBOUNCE_MS) return;
            lastScanTime.current = now;
            setScanning(true);
            navigation.navigate("Result", { barcode });
            setTimeout(() => setScanning(false), SCAN_DEBOUNCE_MS);
        },
        [navigation]
    );

    if (!permission) {
        return (
            <View style={styles.center}>
                <ActivityIndicator color={COLORS.primary} />
            </View>
        );
    }

    if (!permission.granted) {
        return (
            <View style={styles.center}>
                <Text style={styles.permissionEmoji}>📷</Text>
                <Text style={styles.errorText}>Cần quyền truy cập camera</Text>
                <TouchableOpacity style={styles.retryBtn} onPress={requestPermission}>
                    <Text style={styles.retryText}>Cho phép Camera</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {/* Camera Scanner */}
            <View style={styles.cameraContainer}>
                <CameraView
                    style={StyleSheet.absoluteFillObject}
                    facing="back"
                    barcodeScannerSettings={{
                        barcodeTypes: ["ean13", "ean8", "upc_a"],
                    }}
                    onBarcodeScanned={scanning ? undefined : handleBarcodeScanned}
                />
                {/* Overlay */}
                <View style={styles.overlay}>
                    {/* Allergy Status Badge — góc trên */}
                    {isAuthenticated && preferences && (
                        <TouchableOpacity
                            style={[styles.allergyBadge, isPremium && profileCompleted ? styles.badgeActive : isPremium ? styles.badgeWarning : styles.badgeFree]}
                            onPress={() => navigation.navigate(isPremium ? "SafetyWizard" : "Upgrade")}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.badgeText}>
                                {isPremium && profileCompleted
                                    ? `🛡️ Bảo vệ ${allergyCount} dị ứng`
                                    : isPremium
                                        ? "⚠️ Hoàn thiện hồ sơ"
                                        : "🔒 Nâng cấp PREMIUM"}
                            </Text>
                        </TouchableOpacity>
                    )}
                    {/* Corner decorations */}
                    <View style={styles.frameWrapper}>
                        <View style={[styles.corner, styles.cornerTL]} />
                        <View style={[styles.corner, styles.cornerTR]} />
                        <View style={[styles.corner, styles.cornerBL]} />
                        <View style={[styles.corner, styles.cornerBR]} />
                    </View>
                    <Text style={styles.scanHint}>
                        {scanning ? "⏳ Đang xử lý..." : "Đưa barcode vào khung để quét"}
                    </Text>
                </View>
            </View>

            {/* Recent Scans */}
            <View style={styles.historyContainer}>
                <View style={styles.historyHeader}>
                    <Text style={styles.sectionTitle}>🕐 Quét gần đây</Text>
                    {recentItems && recentItems.length > 0 && (
                        <TouchableOpacity onPress={() => navigation.navigate("Tabs", { screen: "History" } as never)}>
                            <Text style={styles.seeAllLink}>Xem tất cả →</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {!isAuthenticated ? (
                    <Text style={styles.muted}>Đăng nhập để xem lịch sử quét</Text>
                ) : !recentItems || recentItems.length === 0 ? (
                    <Text style={styles.muted}>Chưa có lịch sử quét</Text>
                ) : (
                    <FlatList
                        data={recentItems}
                        keyExtractor={(item: ScanHistoryItem) => item.scanId ?? item.barcode}
                        scrollEnabled={false}
                        renderItem={({ item }: { item: ScanHistoryItem }) => (
                            <TouchableOpacity
                                style={styles.historyItem}
                                onPress={() => navigation.navigate("Result", { barcode: item.barcode })}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.ratingEmoji}>
                                    {COLOR_EMOJI[item.snapshotColor] ?? "⚪"}
                                </Text>
                                <View style={styles.historyInfo}>
                                    <Text style={styles.historyBarcode}>{item.barcode}</Text>
                                    <Text style={styles.historyDate}>
                                        {new Date(item.scannedAt).toLocaleDateString("vi-VN")}
                                    </Text>
                                </View>
                                <View style={[styles.colorDot, { backgroundColor: RATING_COLORS[item.snapshotColor]?.bg ?? COLORS.border }]} />
                            </TouchableOpacity>
                        )}
                    />
                )}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.background, gap: 16, padding: 24 },

    // Camera
    cameraContainer: { flex: 2 },
    overlay: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center" },
    frameWrapper: { width: 260, height: 160, position: "relative" },

    // Corner decorations
    corner: { position: "absolute", width: 22, height: 22, borderColor: COLORS.primary, borderWidth: 3 },
    cornerTL: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 4 },
    cornerTR: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 4 },
    cornerBL: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 4 },
    cornerBR: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 4 },

    scanHint: { color: COLORS.white, marginTop: 20, fontSize: 13, backgroundColor: "rgba(0,0,0,0.5)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },

    // History panel
    historyContainer: { flex: 1, backgroundColor: COLORS.surface, padding: 16 },
    historyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
    sectionTitle: { color: COLORS.text, fontSize: 15, fontWeight: "600" },
    seeAllLink: { color: COLORS.primary, fontSize: 13, fontWeight: "500" },
    historyItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: COLORS.border },
    ratingEmoji: { fontSize: 18 },
    historyInfo: { flex: 1 },
    historyBarcode: { color: COLORS.text, fontSize: 14, fontWeight: "500" },
    historyDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
    colorDot: { width: 8, height: 8, borderRadius: 4 },
    muted: { color: COLORS.textMuted, fontSize: 13 },

    // Permission
    permissionEmoji: { fontSize: 40 },
    errorText: { color: COLORS.text, fontSize: 16, fontWeight: "600" },
    retryBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 10 },
    retryText: { color: COLORS.white, fontWeight: "600" },

    // Allergy Status Badge
    allergyBadge: { position: "absolute", top: 16, alignSelf: "center", paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
    badgeActive: { backgroundColor: "rgba(22, 101, 52, 0.85)" },   // green — protected
    badgeWarning: { backgroundColor: "rgba(180, 83, 9, 0.85)" },   // amber — incomplete
    badgeFree: { backgroundColor: "rgba(15, 23, 42, 0.75)", borderWidth: 1, borderColor: COLORS.border },  // dark — upgrade
    badgeText: { color: COLORS.white, fontSize: 13, fontWeight: "700" },
});
