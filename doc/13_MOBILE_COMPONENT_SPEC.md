# 13 – Mobile Component Specification

Tài liệu này định nghĩa từng component UI của DICO Scan Mobile: props, variants, và design tokens.

---

## 1. Design Tokens (`src/constants/colors.ts`)

```typescript
export const RATING_COLORS = {
  GREEN:   { bg: "#22C55E", text: "#FFFFFF", label: "An toàn" },
  YELLOW:  { bg: "#EAB308", text: "#FFFFFF", label: "Cẩn thận" },
  RED:     { bg: "#EF4444", text: "#FFFFFF", label: "Nguy hiểm" },
  UNKNOWN: { bg: "#6B7280", text: "#FFFFFF", label: "Chưa rõ" },
} as const;

export const COLORS = {
  primary:    "#6366F1",   // Indigo – brand primary
  background: "#0F172A",   // Dark navy – dark mode base
  surface:    "#1E293B",   // Card background
  text:       "#F1F5F9",   // Primary text
  textMuted:  "#94A3B8",   // Muted/secondary text
  border:     "#334155",   // Divider/border
  success:    "#22C55E",
  warning:    "#EAB308",
  danger:     "#EF4444",
};
```

---

## 2. Component List

### `RatingBadge`

Hiển thị nhãn màu kết quả (GREEN/YELLOW/RED/UNKNOWN).

```typescript
interface RatingBadgeProps {
  rating: RatingColor;
  size?: "small" | "large";  // default: "large"
}
```

**Visual:**
- `large`: Card full-width, icon + text lớn (màn hình ResultScreen)
- `small`: Pill badge nhỏ (màn hình HistoryScreen)
- Animation: FadeIn 300ms + scale từ 0.85 → 1.0

---

### `ScoreBar`

Thanh điểm gradient 0–100.

```typescript
interface ScoreBarProps {
  score: number | null;  // null → hiển thị "N/A"
  animated?: boolean;    // default: true
}
```

**Visual:**
- Gradient: RED(0) → YELLOW(40) → GREEN(70) → GREEN(100)
- Animated fill khi mount (500ms ease-out)

---

### `AiSummaryCard`

Khung hiển thị tóm tắt AI.

```typescript
interface AiSummaryCardProps {
  summary: string | null;
  isLoading?: boolean;
}
```

**States:**
- `isLoading=true` → Skeleton pulse animation
- `summary=null` → Text fallback: "Đang phân tích thành phần sản phẩm..."
- `summary` có giá trị → Hiển thị text với icon ✨

---

### `OverrideWarningCard`

Cảnh báo khi có `override_reasons`. **Không được phép ẩn component này**.

```typescript
interface OverrideWarningCardProps {
  reasons: string[];  // Phải > 0 để render
}
```

**Visual:**
- Background: `#450A0A` (đỏ tối)
- Border: `#EF4444`
- Icon: ⚠️ với text lý do override
- GUARDRAIL: `reasons.length === 0` → render `null`, không render component rỗng

---

### `ProductInfoHeader`

Header thông tin sản phẩm.

```typescript
interface ProductInfoHeaderProps {
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  barcode: string;
}
```

**Visual:**
- `imageUrl` có giá trị → Hiển thị ảnh sản phẩm (circle, 80px)
- `imageUrl = null` → Hiển thị icon barcode placeholder
- `name = null` → "Tên không xác định"

---

### `AllergyTagSelector`

Bộ chọn dị ứng.

```typescript
interface AllergyTagSelectorProps {
  selected: string[];
  onChange: (selected: string[]) => void;
  maxSelection?: number;  // default: 5
}
```

**Visual:**
- Tags hiển thị dạng pill
- Selected: bg=primary, text=white
- Disabled (đủ max): opacity 50%, không tap được
- Hiển thị counter: "3/5 đã chọn"

---

### `ErrorBanner`

```typescript
interface ErrorBannerProps {
  message: string;
  onRetry?: () => void;
}
```

---

### `LoadingSkeleton`

```typescript
interface LoadingSkeletonProps {
  variant: "product" | "list-item" | "text";
  lines?: number;  // cho variant="text"
}
```

---

### `CameraScanner`

```typescript
interface CameraScannerProps {
  onBarcodeScanned: (barcode: string) => void;
  debounceMs?: number;  // default: 2000 (RULE_MOB_06)
}
```

**Behavior:**
- Sử dụng `expo-barcode-scanner`
- Chỉ nhận EAN-8, EAN-13, UPC-A
- Debounce 2000ms để tránh spam

---

## 3. Navigation Structure

```
RootNavigator (Stack)
├── TabNavigator (Bottom Tabs)
│   ├── Tab 1: HomeScreen       (icon: barcode)
│   ├── Tab 2: HistoryScreen    (icon: clock)
│   └── Tab 3: PreferencesScreen (icon: settings)
└── ResultScreen    (modal-style push, không có tab)
└── ContributeScreen (modal-style push)
```

---

## 4. Typography

| Token | Font | Size | Weight | Usage |
|---|---|---|---|---|
| `h1` | Inter | 28 | Bold | Tên sản phẩm |
| `h2` | Inter | 22 | SemiBold | Rating label |
| `body` | Inter | 16 | Regular | AI Summary |
| `caption` | Inter | 12 | Regular | Ngày quét, barcode |
| `badge` | Inter | 14 | Bold | Score number |
