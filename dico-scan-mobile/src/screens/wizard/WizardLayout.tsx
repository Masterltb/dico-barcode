// src/screens/wizard/WizardLayout.tsx
// Shared layout for all wizard steps: progress bar + title + content + nav buttons

import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { COLORS } from "@/constants/colors";

interface Props {
    step: number;
    totalSteps: number;
    title: string;
    subtitle?: string;
    canNext: boolean;
    onNext: () => void;
    onBack: () => void;
    nextLabel?: string;
    children: React.ReactNode;
}

export default function WizardLayout({
    step,
    totalSteps,
    title,
    subtitle,
    canNext,
    onNext,
    onBack,
    nextLabel = "Tiếp tục",
    children,
}: Props) {
    const progress = step / totalSteps;

    return (
        <View style={styles.container}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                </View>
                <Text style={styles.progressText}>
                    {step}/{totalSteps}
                </Text>
            </View>

            {/* Header */}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

            {/* Content */}
            <ScrollView
                style={styles.scrollArea}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {children}
            </ScrollView>

            {/* Navigation Buttons */}
            <View style={styles.navRow}>
                <TouchableOpacity style={styles.backBtn} onPress={onBack}>
                    <Text style={styles.backBtnText}>← Quay lại</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.nextBtn, !canNext && styles.nextBtnDisabled]}
                    onPress={onNext}
                    disabled={!canNext}
                >
                    <Text style={styles.nextBtnText}>{nextLabel} →</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: COLORS.background, padding: 20 },
    progressContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20 },
    progressTrack: { flex: 1, height: 6, backgroundColor: COLORS.surface, borderRadius: 3, overflow: "hidden" },
    progressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 3 },
    progressText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600", minWidth: 30 },
    title: { color: COLORS.text, fontSize: 24, fontWeight: "800", marginBottom: 6 },
    subtitle: { color: COLORS.textMuted, fontSize: 14, marginBottom: 16, lineHeight: 20 },
    scrollArea: { flex: 1 },
    scrollContent: { paddingBottom: 20 },
    navRow: { flexDirection: "row", gap: 12, paddingTop: 12 },
    backBtn: { flex: 1, padding: 16, borderRadius: 12, backgroundColor: COLORS.surface, alignItems: "center" },
    backBtnText: { color: COLORS.textMuted, fontSize: 15, fontWeight: "600" },
    nextBtn: { flex: 2, padding: 16, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center" },
    nextBtnDisabled: { opacity: 0.4 },
    nextBtnText: { color: COLORS.white, fontSize: 15, fontWeight: "700" },
});
