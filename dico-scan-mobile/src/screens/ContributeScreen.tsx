// src/screens/ContributeScreen.tsx

import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
    ActivityIndicator,
    Alert,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { RootStackParamList } from "@/navigation/RootNavigator";
import { COLORS } from "@/constants/colors";
import { submitContribution } from "@/api/contribute";

type Props = NativeStackScreenProps<RootStackParamList, "Contribute">;

export default function ContributeScreen({ route, navigation }: Props) {
    const { barcode } = route.params;
    const [imageUri, setImageUri] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri ?? null);
        }
    };

    const takePhoto = async () => {
        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
            setImageUri(result.assets[0].uri ?? null);
        }
    };

    const handleSubmit = async () => {
        if (!imageUri) return;
        setUploading(true);
        try {
            await submitContribution(barcode, imageUri);
            Alert.alert(
                "✅ Cảm ơn!",
                "Ảnh đã được gửi. Chúng tôi sẽ xử lý và cập nhật sản phẩm sớm nhất.",
                [{ text: "Về trang chủ", onPress: () => navigation.popToTop() }]
            );
        } catch {
            Alert.alert("Lỗi", "Không thể upload ảnh. Vui lòng thử lại.");
        } finally {
            setUploading(false);
        }
    };

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.closeBtn} onPress={() => navigation.goBack()}>
                <Text style={styles.closeBtnText}>✕ Đóng</Text>
            </TouchableOpacity>

            <Text style={styles.title}>📸 Đóng góp sản phẩm</Text>
            <Text style={styles.barcode}>Mã vạch: {barcode}</Text>
            <Text style={styles.subtitle}>
                Sản phẩm chưa có trong hệ thống. Chụp ảnh mặt trước nhãn sản phẩm để đóng góp thêm dữ liệu.
            </Text>

            {/* Image Preview */}
            {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.preview} />
            ) : (
                <View style={styles.placeholder}>
                    <Text style={{ fontSize: 48 }}>📦</Text>
                    <Text style={styles.placeholderText}>Chưa có ảnh</Text>
                </View>
            )}

            {/* Action Buttons */}
            <View style={styles.actions}>
                <TouchableOpacity style={styles.secondaryBtn} onPress={takePhoto}>
                    <Text style={styles.secondaryBtnText}>📷 Chụp ảnh</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.secondaryBtn} onPress={pickImage}>
                    <Text style={styles.secondaryBtnText}>🖼 Thư viện</Text>
                </TouchableOpacity>
            </View>

            {/* Submit Button */}
            <TouchableOpacity
                style={[styles.submitBtn, (!imageUri || uploading) && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={!imageUri || uploading}
            >
                {uploading ? (
                    <ActivityIndicator color={COLORS.white} />
                ) : (
                    <Text style={styles.submitBtnText}>Gửi đóng góp</Text>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    closeBtn: { alignSelf: "flex-end", marginBottom: 16 },
    closeBtnText: { color: COLORS.textMuted },
    title: { color: COLORS.text, fontSize: 22, fontWeight: "700", marginBottom: 4 },
    barcode: { color: COLORS.primary, fontSize: 14, marginBottom: 8 },
    subtitle: { color: COLORS.textMuted, fontSize: 14, lineHeight: 20, marginBottom: 20 },
    preview: { width: "100%", height: 220, borderRadius: 12, marginBottom: 16 },
    placeholder: { width: "100%", height: 220, borderRadius: 12, backgroundColor: COLORS.surface, justifyContent: "center", alignItems: "center", marginBottom: 16 },
    placeholderText: { color: COLORS.textMuted, marginTop: 8 },
    actions: { flexDirection: "row", gap: 12, marginBottom: 16 },
    secondaryBtn: { flex: 1, backgroundColor: COLORS.surface, padding: 14, borderRadius: 10, alignItems: "center" },
    secondaryBtnText: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
    submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" },
    submitBtnDisabled: { opacity: 0.5 },
    submitBtnText: { color: COLORS.white, fontSize: 16, fontWeight: "700" },
});
