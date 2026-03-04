// src/screens/AuthScreen.tsx
// Login / Register screen with tab toggle.

import React, { useState } from "react";
import {
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { COLORS } from "@/constants/colors";
import { useAuthStore } from "@/store/authStore";

type Tab = "login" | "register";

export default function AuthScreen() {
    const [tab, setTab] = useState<Tab>("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const { login, register } = useAuthStore();

    const handleSubmit = async () => {
        setError(null);

        // Client-side validation
        if (!email.trim()) {
            setError("Vui lòng nhập email");
            return;
        }
        if (!password.trim()) {
            setError("Vui lòng nhập mật khẩu");
            return;
        }
        if (password.length < 6) {
            setError("Mật khẩu phải từ 6 ký tự trở lên");
            return;
        }

        setLoading(true);
        try {
            if (tab === "login") {
                await login(email.trim(), password);
            } else {
                await register(email.trim(), password, displayName.trim() || undefined);
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
            const message =
                axiosErr.response?.data?.message ??
                axiosErr.message ??
                "Đã xảy ra lỗi. Vui lòng thử lại.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const switchTab = (newTab: Tab) => {
        setTab(newTab);
        setError(null);
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo / Header */}
                <View style={styles.header}>
                    <Text style={styles.logo}>🔍</Text>
                    <Text style={styles.appName}>DICO Scan</Text>
                    <Text style={styles.tagline}>
                        Quét sản phẩm • Kiểm tra an toàn • AI phân tích
                    </Text>
                </View>

                {/* Tab Toggle */}
                <View style={styles.tabRow}>
                    <TouchableOpacity
                        style={[styles.tab, tab === "login" && styles.tabActive]}
                        onPress={() => switchTab("login")}
                    >
                        <Text style={[styles.tabText, tab === "login" && styles.tabTextActive]}>
                            Đăng nhập
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.tab, tab === "register" && styles.tabActive]}
                        onPress={() => switchTab("register")}
                    >
                        <Text style={[styles.tabText, tab === "register" && styles.tabTextActive]}>
                            Đăng ký
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Form */}
                <View style={styles.form}>
                    {tab === "register" && (
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Tên hiển thị</Text>
                            <TextInput
                                style={styles.input}
                                value={displayName}
                                onChangeText={setDisplayName}
                                placeholder="Ví dụ: Nguyễn Văn A"
                                placeholderTextColor={COLORS.textMuted}
                                maxLength={100}
                                autoCapitalize="words"
                            />
                        </View>
                    )}

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={email}
                            onChangeText={setEmail}
                            placeholder="email@example.com"
                            placeholderTextColor={COLORS.textMuted}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.label}>Mật khẩu *</Text>
                        <TextInput
                            style={styles.input}
                            value={password}
                            onChangeText={setPassword}
                            placeholder="Tối thiểu 6 ký tự"
                            placeholderTextColor={COLORS.textMuted}
                            secureTextEntry
                        />
                    </View>

                    {/* Error */}
                    {error && (
                        <View style={styles.errorBox}>
                            <Text style={styles.errorText}>⚠️ {error}</Text>
                        </View>
                    )}

                    {/* Submit Button */}
                    <TouchableOpacity
                        style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color={COLORS.white} />
                        ) : (
                            <Text style={styles.submitBtnText}>
                                {tab === "login" ? "Đăng nhập" : "Tạo tài khoản"}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Switch hint */}
                <Text style={styles.switchHint}>
                    {tab === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                    <Text
                        style={styles.switchLink}
                        onPress={() => switchTab(tab === "login" ? "register" : "login")}
                    >
                        {tab === "login" ? "Đăng ký ngay" : "Đăng nhập"}
                    </Text>
                </Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background },
    scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24, paddingBottom: 40 },
    header: { alignItems: "center", marginBottom: 36 },
    logo: { fontSize: 56, marginBottom: 12 },
    appName: { color: COLORS.text, fontSize: 32, fontWeight: "800", marginBottom: 8 },
    tagline: { color: COLORS.textMuted, fontSize: 14, textAlign: "center" },
    tabRow: { flexDirection: "row", backgroundColor: COLORS.surface, borderRadius: 12, padding: 4, marginBottom: 24 },
    tab: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: "center" },
    tabActive: { backgroundColor: COLORS.primary },
    tabText: { color: COLORS.textMuted, fontSize: 15, fontWeight: "600" },
    tabTextActive: { color: COLORS.white },
    form: { gap: 16 },
    inputGroup: { gap: 6 },
    label: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
    input: {
        backgroundColor: COLORS.surface,
        color: COLORS.text,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    errorBox: { backgroundColor: "#450A0A", borderRadius: 10, padding: 12, borderWidth: 1, borderColor: COLORS.danger },
    errorText: { color: "#FCA5A5", fontSize: 14 },
    submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: "center", marginTop: 8 },
    submitBtnDisabled: { opacity: 0.6 },
    submitBtnText: { color: COLORS.white, fontSize: 17, fontWeight: "700" },
    switchHint: { color: COLORS.textMuted, textAlign: "center", marginTop: 20, fontSize: 14 },
    switchLink: { color: COLORS.primary, fontWeight: "600" },
});
