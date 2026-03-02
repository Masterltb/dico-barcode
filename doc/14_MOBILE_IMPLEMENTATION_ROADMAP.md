# 14 – Mobile Implementation Roadmap

Roadmap chi tiết từng bước để agent/developer có thể thực thi không cần hỏi thêm. Mỗi bước có Acceptance Criteria (AC) rõ ràng.

---

## Sprint 1: Foundation & Navigation (Ngày 1-2)

### Bước 1.1 – Khởi tạo Expo Project
```bash
# Chạy tại e:\exe101\
npx create-expo-app@latest dico-scan-mobile --template blank-typescript
cd dico-scan-mobile
```
**AC:** `app.json` tồn tại, `npx expo start` không lỗi.

---

### Bước 1.2 – Cấu hình TypeScript Strict
Sửa `tsconfig.json`:
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "paths": { "@/*": ["./src/*"] }
  }
}
```
**AC:** `npx tsc --noEmit` pass.

---

### Bước 1.3 – Cài đặt Dependencies
```bash
npx expo install expo-barcode-scanner expo-camera expo-image-picker
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npx expo install react-native-screens react-native-safe-area-context
npm install zustand @tanstack/react-query axios @react-native-async-storage/async-storage
npm install nativewind tailwindcss
npm install react-hook-form zod @hookform/resolvers
npm install -D @types/react @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint prettier
```
**AC:** `npm install` không có peer dependency error.

---

### Bước 1.4 – Cấu hình NativeWind v4
1. Tạo `tailwind.config.js`
2. Sửa `babel.config.js` thêm `nativewind/babel`
3. Tạo `global.css` import tailwind directives
4. Wrap `App.tsx` với `<NativeWindStyleSheet.setOutput type="native" />`

**AC:** Một component với `className="bg-indigo-500"` hiển thị màu đúng.

---

### Bước 1.5 – Cấu hình Environment Variables
Tạo `.env.example`:
```bash
EXPO_PUBLIC_API_URL=http://localhost:8080
EXPO_PUBLIC_API_TIMEOUT_MS=5000
```
Tạo `.env` (gitignored) với giá trị thực tế.

---

### Bước 1.6 – API Client Layer (`src/api/`)
Tạo 4 files theo đúng spec trong `12_MOBILE_API_CONTRACT.md`:
- `src/api/client.ts` — Axios instance + interceptors
- `src/api/types.ts` — TypeScript types
- `src/api/products.ts` — `getProduct()`
- `src/api/contribute.ts` — `submitContribution()`

**AC:** `tsc --noEmit` pass, không có `any` type tường minh.

---

### Bước 1.7 – Navigation Setup
```typescript
// src/navigation/RootNavigator.tsx
// Stack: TabNavigator + ResultScreen (modal) + ContributeScreen (modal)
```
**AC:** Điều hướng giữa 3 tabs không lỗi, back button hoạt động đúng.

---

## Sprint 2: Core Screens (Ngày 3-5)

### Bước 2.1 – Zustand Stores
```typescript
// src/store/userPreferencesStore.ts
interface PreferencesState {
  allergies: string[];   // max 5
  diet: string;
  setAllergies: (a: string[]) => void;
  setDiet: (d: string) => void;
  hydrate: () => Promise<void>;  // load từ AsyncStorage
}

// src/store/scanHistoryStore.ts
interface ScanHistoryState {
  recent: ScanHistoryItem[];  // 5 items gần nhất
  add: (item: ScanHistoryItem) => void;
}
```
**AC:** Sau khi restart app, preferences vẫn được giữ nguyên (AsyncStorage persist).

---

### Bước 2.2 – HomeScreen
- `CameraScanner` component với debounce 2000ms (RULE_MOB_06)
- `RecentHistoryList` hiển thị 5 scan gần nhất từ store
- Khi scan → gọi `getProduct()` → navigate ResultScreen hoặc ContributeScreen

**AC:** AC_HOME_01, AC_HOME_02, AC_HOME_03 pass.

---

### Bước 2.3 – ResultScreen
- Nhận `barcode` qua route params
- Dùng `useProduct(barcode)` hook (TanStack Query)
- Render: `ProductInfoHeader`, `RatingBadge`, `ScoreBar`, `AiSummaryCard`, `OverrideWarningCard` (nếu có)

**AC:** AC_RESULT_01 → 04 pass. Đặc biệt: KHÔNG tính màu từ điểm (RULE_MOB_01).

---

### Bước 2.4 – PreferencesScreen
- `AllergyTagSelector` với max 5
- `DietPicker` dropdown
- `SaveButton` → gọi `PUT /v1/users/me/preferences` + lưu Zustand store

**AC:** AC_PREF_01 → 03 pass.

---

### Bước 2.5 – ContributeScreen
- `expo-image-picker` → chọn hoặc chụp ảnh
- Preview ảnh
- Upload via `submitContribution()`
- Khi 202 → back to Home + hiển thị thank-you message

**AC:** AC_CONTRIB_01 → 03 pass.

---

### Bước 2.6 – HistoryScreen
- TanStack Query + pagination
- Infinite scroll
- FilterBar

**AC:** AC_HIST_01, AC_HIST_02 pass.

---

## Sprint 3: Polish & Testing (Ngày 6-7)

### Bước 3.1 – Loading States & Error States
- Tất cả screens có `<LoadingSkeleton />` khi isLoading
- Tất cả screens có `<ErrorBanner onRetry={refetch} />` khi error

**AC:** UX_01, UX_02 pass.

---

### Bước 3.2 – Dark Mode
- Tất cả components dùng design tokens từ `colors.ts`
- Test trên iOS Simulator với Light/Dark toggle

**AC:** UX_03 pass.

---

### Bước 3.3 – Unit Tests
```bash
# Test API client
# Test Zustand stores (persist logic)
# Test RatingBadge rendering per rating color
npm test
```
**AC:** Tất cả tests pass, coverage > 70% cho `src/api/` và `src/store/`.

---

### Bước 3.4 – Final TypeScript Check
```bash
npx tsc --noEmit
```
**AC:** 0 errors, 0 warnings với strict mode.

---

## Checklist Tách Repo (Future)

Khi sẵn sàng tách `dico-scan-mobile` thành repo riêng:

- [ ] Đổi `EXPO_PUBLIC_API_URL` từ `localhost:8080` sang production URL (Cloud Run)
- [ ] Setup CI/CD riêng (GitHub Actions → EAS Build)
- [ ] Di chuyển `doc/10_*.md` → `14_*.md` vào repo mobile
- [ ] Chạy `git subtree split --prefix=dico-scan-mobile -b mobile-standalone`

---

## Cấu trúc File Cuối cùng (Expected Output)

```
dico-scan-mobile/
├── src/
│   ├── api/          [Sprint 1]
│   ├── components/   [Sprint 2]
│   ├── screens/      [Sprint 2]
│   ├── navigation/   [Sprint 1]
│   ├── store/        [Sprint 2]
│   ├── hooks/        [Sprint 2]
│   └── constants/    [Sprint 1]
├── package.json      [Sprint 1]
└── tsconfig.json     [Sprint 1]
```
