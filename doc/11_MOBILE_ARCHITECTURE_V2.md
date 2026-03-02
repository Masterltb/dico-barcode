# 11 – Mobile Architecture & Technical Guardrails V2

Tài liệu này định nghĩa kiến trúc kỹ thuật, cấu trúc thư mục, tech stack, và các guardrails bắt buộc cho **DICO Scan Mobile** (Expo Managed Workflow).

---

## 1. Tech Stack

| Layer | Thư viện | Version | Lý do chọn |
|---|---|---|---|
| Runtime | **Expo** | SDK 52 | Managed workflow, built-in Camera/Barcode |
| Language | **TypeScript** | 5.3+ strict | Type safety, đồng bộ với backend DTO |
| Navigation | **React Navigation** | v7 | Industry standard, deep linking support |
| State Management | **Zustand** | 4.x | Lightweight, zero boilerplate |
| API Client | **Axios** | 1.x | Interceptors, timeout, easy mock |
| Server State | **TanStack Query** | v5 | Cache, retry, stale-while-revalidate |
| Styling | **NativeWind** | v4 | Tailwind tokens cho React Native |
| Forms | **React Hook Form** + **Zod** | latest | Type-safe validation |
| Local Storage | **AsyncStorage** | @react-native-async-storage | Persist preferences offline-first |
| Testing | **Jest** + **@testing-library/react-native** | – | Unit + Integration |
| Linting | **ESLint** + **Prettier** | – | Code quality |

---

## 2. Cấu trúc Thư mục

```
dico-scan-mobile/
├── src/
│   ├── api/                      ← HTTP layer (ISOLATED, dễ tách)
│   │   ├── client.ts             ← Axios instance + interceptors
│   │   ├── products.ts           ← /v1/products endpoints
│   │   ├── users.ts              ← /v1/users endpoints
│   │   ├── contribute.ts         ← /v1/contribute endpoint
│   │   └── types.ts              ← Shared TypeScript types (mirrors backend DTO)
│   ├── components/               ← Reusable UI
│   │   ├── RatingBadge.tsx
│   │   ├── ScoreBar.tsx
│   │   ├── AiSummaryCard.tsx
│   │   ├── OverrideWarningCard.tsx
│   │   ├── ScanHistoryItem.tsx
│   │   ├── AllergyTagSelector.tsx
│   │   ├── ErrorBanner.tsx
│   │   └── LoadingSkeleton.tsx
│   ├── screens/                  ← Màn hình (1 file = 1 screen)
│   │   ├── HomeScreen.tsx
│   │   ├── ResultScreen.tsx
│   │   ├── PreferencesScreen.tsx
│   │   ├── ContributeScreen.tsx
│   │   └── HistoryScreen.tsx
│   ├── navigation/
│   │   ├── RootNavigator.tsx     ← Stack navigator root
│   │   └── TabNavigator.tsx      ← Bottom tabs (Home, History, Preferences)
│   ├── store/
│   │   ├── userPreferencesStore.ts  ← Zustand: allergies, diet
│   │   └── scanHistoryStore.ts      ← Zustand: local cache history
│   ├── hooks/
│   │   ├── useProduct.ts         ← TanStack Query wrapper for products API
│   │   ├── useScanHistory.ts
│   │   └── usePreferences.ts
│   └── constants/
│       ├── colors.ts             ← Design tokens: RATING_COLORS, etc.
│       ├── config.ts             ← API_URL, timeouts
│       └── strings.ts            ← Vietnamese UI strings
├── assets/                       ← Icons, splash, images
├── app.json                      ← Expo config
├── babel.config.js
├── tsconfig.json
├── package.json
├── .env                          ← EXPO_PUBLIC_API_URL (gitignored)
├── .env.example                  ← Template (committed)
└── .eslintrc.js
```

---

## 3. Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  DICO Scan Mobile                    │
│                                                     │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │ Screens   │→ │  Hooks        │→ │ TanStack     │  │
│  │ (UI Only) │  │ (useProduct) │  │ Query Cache  │  │
│  └──────────┘  └──────────────┘  └──────┬───────┘  │
│                                         │            │
│  ┌──────────┐                    ┌──────▼───────┐  │
│  │  Zustand  │                   │  API Client  │  │
│  │  Store    │                   │  (Axios)     │  │
│  └──────────┘                    └──────┬───────┘  │
│                                         │            │
└─────────────────────────────────────────┼───────────┘
                                          │ HTTPS
                               ┌──────────▼───────┐
                               │ Spring Boot API   │
                               │ localhost:8080    │
                               │ (or Cloud Run)    │
                               └──────────────────┘
```

---

## 4. Guardrails Bắt buộc

### RULE_MOB_01: Frontend KHÔNG được tính Rating Color
```typescript
// ❌ SAI — Frontend không được làm điều này
const color = score > 70 ? "GREEN" : score > 40 ? "YELLOW" : "RED";

// ✅ ĐÚNG — Chỉ đọc giá trị từ API
const { rating } = productData; // "GREEN" | "YELLOW" | "RED" | "UNKNOWN"
```

### RULE_MOB_02: API Client phải isolate hoàn toàn trong `src/api/`
Screens và hooks không được import `axios` trực tiếp. Phải dùng qua `src/api/products.ts`.

### RULE_MOB_03: Environment variables dùng prefix `EXPO_PUBLIC_`
```bash
# .env
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_API_TIMEOUT_MS=5000
```

### RULE_MOB_04: No business logic trong Components
Components chỉ nhận props và render. Logic xử lý đặt trong hooks.

### RULE_MOB_05: Mọi API call phải xử lý Error State
```typescript
// Bắt buộc: 3 state cho mọi query
const { data, isLoading, error } = useProduct(barcode);
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorBanner onRetry={refetch} />;
```

### RULE_MOB_06: Debounce Barcode Scanner 2 giây
Tránh spam API khi camera liên tục nhận diện cùng 1 barcode.

---

## 5. Thiết kế để tách repo (Future Separation)

Khi cần tách `dico-scan-mobile` thành repo riêng:
```bash
# Lệnh tách trong tương lai (không cần làm ngay)
git subtree split --prefix=dico-scan-mobile -b mobile-standalone
git push origin mobile-standalone
```

**Điều kiện để tách được dễ dàng:**
1. `src/api/client.ts` dùng env var cho base URL — ✅ Đã thiết kế
2. Không có shared code giữa backend và mobile — ✅ Không dùng chung package.json
3. `.env.example` đã có sẵn — ✅ Sẽ tạo
