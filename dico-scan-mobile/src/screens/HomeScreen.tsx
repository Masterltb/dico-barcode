// src/screens/HomeScreen.tsx
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions, BarcodeScanningResult } from "expo-camera";
import React, { useCallback, useRef, useState } from "react";
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    ActivityIndicator,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS, RATING_COLORS } from "@/constants/colors";

type HomeNavProp = NativeStackNavigationProp<RootStackParamList>;

interface RecentItem {
    barcode: string;
    name: string | null;
    rating: "GREEN" | "YELLOW" | "RED" | "UNKNOWN";
    scannedAt: string;
}

interface Props {
    navigation: HomeNavProp;
}

// RULE_MOB_06: Debounce 2 seconds between scans
const SCAN_DEBOUNCE_MS = 2000;

export default function HomeScreen({ navigation }: Props) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanning, setScanning] = useState(false);
    const lastScanTime = useRef<number>(0);
    const [recentItems] = useState<RecentItem[]>([]);

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
                <Text style={styles.errorText}>📷 Cần quyền truy cập camera</Text>
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
                    <View style={styles.scanFrame} />
                    <Text style={styles.scanHint}>
                        {scanning ? "Đang xử lý..." : "Đưa barcode vào khung để quét"}
                    </Text>
                </View>
            </View>

            {/* Recent History */}
            <View style={styles.historyContainer}>
                <Text style={styles.sectionTitle}>Quét gần đây</Text>
                {recentItems.length === 0 ? (
                    <Text style={styles.muted}>Chưa có lịch sử quét</Text>
                ) : (
                    <FlatList
                        data={recentItems}
                        keyExtractor={(item) => item.barcode}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.historyItem}
                                onPress={() =>
                                    navigation.navigate("Result", { barcode: item.barcode })
                                }
                            >
                                <View
                                    style={[
                                        styles.ratingDot,
                                        { backgroundColor: RATING_COLORS[item.rating].bg },
                                    ]}
                                />
                                <Text style={styles.historyName} numberOfLines={1}>
                                    {item.name ?? item.barcode}
                                </Text>
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
    center: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: COLORS.background,
        gap: 16,
        padding: 24,
    },
    cameraContainer: { flex: 2 },
    overlay: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: "center",
        alignItems: "center",
    },
    scanFrame: {
        width: 260,
        height: 160,
        borderWidth: 2,
        borderColor: COLORS.primary,
        borderRadius: 12,
    },
    scanHint: { color: COLORS.text, marginTop: 16, fontSize: 14 },
    historyContainer: {
        flex: 1,
        backgroundColor: COLORS.surface,
        padding: 16,
    },
    sectionTitle: {
        color: COLORS.text,
        fontSize: 16,
        fontWeight: "600",
        marginBottom: 8,
    },
    historyItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 10,
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    ratingDot: { width: 10, height: 10, borderRadius: 5 },
    historyName: { color: COLORS.text, fontSize: 14, flex: 1 },
    muted: { color: COLORS.textMuted, fontSize: 14, textAlign: "center" },
    errorText: { color: COLORS.danger, fontSize: 16, fontWeight: "600", textAlign: "center" },
    retryBtn: {
        backgroundColor: COLORS.primary,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 8,
    },
    retryText: { color: COLORS.white, fontWeight: "600" },
});
