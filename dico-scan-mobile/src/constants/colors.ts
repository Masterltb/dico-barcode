// src/constants/colors.ts

import { RatingColor } from "@/api/types";

export const RATING_COLORS: Record<
    RatingColor,
    { bg: string; text: string; label: string; description: string }
> = {
    GREEN: { bg: "#22C55E", text: "#FFFFFF", label: "An toàn", description: "Sản phẩm ít rủi ro" },
    YELLOW: { bg: "#EAB308", text: "#FFFFFF", label: "Cẩn thận", description: "Nên ăn điều độ" },
    RED: { bg: "#EF4444", text: "#FFFFFF", label: "Nguy hiểm", description: "Không khuyến khích dùng thường xuyên" },
    UNKNOWN: { bg: "#6B7280", text: "#FFFFFF", label: "Chưa rõ", description: "Thiếu dữ liệu để đánh giá" },
};

export const COLORS = {
    primary: "#6366F1",
    primaryDark: "#4F46E5",
    background: "#0F172A",
    surface: "#1E293B",
    surfaceAlt: "#334155",
    text: "#F1F5F9",
    textMuted: "#94A3B8",
    border: "#334155",
    success: "#22C55E",
    warning: "#EAB308",
    danger: "#EF4444",
    white: "#FFFFFF",
} as const;
