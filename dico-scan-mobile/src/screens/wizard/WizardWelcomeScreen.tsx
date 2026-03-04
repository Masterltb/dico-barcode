// src/screens/wizard/WizardWelcomeScreen.tsx

import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { COLORS } from "@/constants/colors";
import { useSafetyProfileStore } from "@/store/safetyProfileStore";
import { WizardStackParamList } from "@/navigation/RootNavigator";

type Props = NativeStackScreenProps<WizardStackParamList, "WizardWelcome">;

export default function WizardWelcomeScreen({ navigation }: Props) {
    const reset = useSafetyProfileStore((s) => s.reset);

    const handleStart = () => {
        reset();
        navigation.navigate("WizardTargets");
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.getParent()?.goBack()}>
                <Text style={styles.closeBtnText}>✕ Đóng</Text>
            </TouchableOpacity>

            <View style={styles.hero}>
                <Text style={styles.icon}>🛡️</Text>
                <Text style={styles.title}>Hồ sơ An toàn</Text>
                <Text style={styles.subtitle}>
                    Thiết lập hồ sơ sức khỏe cá nhân để nhận cảnh báo thông minh khi quét sản phẩm.
                </Text>
            </View>

            <View style={styles.features}>
                {[
                    { icon: "⚠️", text: "Cảnh báo dị ứng cá nhân hóa" },
                    { icon: "👶", text: "Bảo vệ trẻ em và thai kỳ" },
                    { icon: "🧪", text: "Phát hiện thành phần mỹ phẩm nguy hại" },
                    { icon: "🤖", text: "AI phân tích chuyên sâu theo hồ sơ" },
                ].map((f, i) => (
                    <View key={i} style={styles.featureRow}>
                        <Text style={styles.featureIcon}>{f.icon}</Text>
                        <Text style={styles.featureText}>{f.text}</Text>
                    </View>
                ))}
            </View>

            <View style={styles.footer}>
                <TouchableOpacity style={styles.startBtn} onPress={handleStart}>
                    <Text style={styles.startBtnText}>Bắt đầu thiết lập</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>⏱ Chỉ mất khoảng 2 phút</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    closeBtn: { alignSelf: "flex-end", marginBottom: 8 },
    closeBtnText: { color: COLORS.textMuted, fontSize: 14 },
    hero: { alignItems: "center", marginTop: 20, marginBottom: 32 },
    icon: { fontSize: 64, marginBottom: 16 },
    title: { color: COLORS.text, fontSize: 28, fontWeight: "800", marginBottom: 12, textAlign: "center" },
    subtitle: { color: COLORS.textMuted, fontSize: 15, lineHeight: 22, textAlign: "center", paddingHorizontal: 16 },
    features: { gap: 16, marginBottom: 32 },
    featureRow: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: COLORS.surface, padding: 16, borderRadius: 12 },
    featureIcon: { fontSize: 24 },
    featureText: { color: COLORS.text, fontSize: 15, flex: 1 },
    footer: { marginTop: "auto", alignItems: "center", gap: 12 },
    startBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, paddingHorizontal: 48, borderRadius: 14, width: "100%", alignItems: "center" },
    startBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
    hint: { color: COLORS.textMuted, fontSize: 13 },
});
