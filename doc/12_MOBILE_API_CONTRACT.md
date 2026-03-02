# 12 – Mobile API Contract

Tài liệu này định nghĩa **chính xác** các kiểu TypeScript, các endpoint, và quy ước mà Mobile App phải tuân theo khi giao tiếp với Backend (`Spring Boot /v1/...`).

> [!IMPORTANT]
> Đây là nguồn sự thật duy nhất (Single Source of Truth) cho API Layer. Bất kỳ thay đổi nào về backend endpoint hoặc DTO **phải** được cập nhật vào đây trước.

---

## 1. TypeScript Types (mirrors Backend DTOs)

```typescript
// src/api/types.ts

export type RatingColor = "GREEN" | "YELLOW" | "RED" | "UNKNOWN";

/** Mirrors: ProductEvaluationResponse.java */
export interface ProductEvaluationResponse {
  barcode: string;
  name: string | null;
  brand: string | null;
  imageUrl: string | null;
  rating: RatingColor;
  score: number | null;        // 0-100, null khi rating = UNKNOWN
  confidenceScore: number;     // 0.0-1.0
  aiSummary: string | null;    // null nếu Gemini timeout/error
  overrideReasons: string[] | null; // null nếu không có override
  cachedAt: string;            // ISO 8601 UTC
}

/** Mirrors: ScanHistoryItemResponse.java */
export interface ScanHistoryItem {
  barcode: string;
  name: string | null;
  scannedAt: string;           // ISO 8601 UTC
  snapshotColor: RatingColor;
}

/** Mirrors: StandardError.java */
export interface StandardError {
  errorCode: string;
  message: string;
  traceId: string;
}

/** Mirrors: UpdatePreferencesRequest.java */
export interface UpdatePreferencesRequest {
  allergies: string[];         // Tối đa 5 items
  diet: string;                // "NONE" | "VEGETARIAN" | "VEGAN" | "LOW_SUGAR" | "LOW_SALT"
}

/** Preferred Allergen tags */
export const ALLERGEN_OPTIONS = [
  "gluten", "peanut", "shellfish", "milk",
  "egg", "soy", "tree_nut", "fish"
] as const;

export type AllergenKey = typeof ALLERGEN_OPTIONS[number];
```

---

## 2. API Endpoints

### 2.1 GET /v1/products/{barcode}

| Item | Value |
|---|---|
| Method | GET |
| Path | `/v1/products/{barcode}` |
| Query Params | `allergies=peanut,gluten` (optional, comma-separated) |
| Headers | `X-User-Id: <uuid>` (MVP, Phase 2 dùng Bearer token) |
| Success | `200 OK` → `ProductEvaluationResponse` |
| Not Found | `404` → `StandardError` (→ điều hướng ContributeScreen) |
| Server Error | `503` → `StandardError` (→ hiển thị ErrorBanner) |

**TypeScript usage:**
```typescript
// src/api/products.ts
export const getProduct = async (
  barcode: string,
  allergies: string[]
): Promise<ProductEvaluationResponse> => {
  const params = allergies.length > 0
    ? { allergies: allergies.join(",") }
    : {};
  const { data } = await apiClient.get<ProductEvaluationResponse>(
    `/v1/products/${barcode}`, { params }
  );
  return data;
};
```

---

### 2.2 GET /v1/users/me/history

| Item | Value |
|---|---|
| Method | GET |
| Path | `/v1/users/me/history` |
| Query Params | `page=0&size=20` |
| Headers | `X-User-Id: <uuid>` |
| Success | `200 OK` → `ScanHistoryItem[]` |

---

### 2.3 PUT /v1/users/me/preferences

| Item | Value |
|---|---|
| Method | PUT |
| Path | `/v1/users/me/preferences` |
| Body | `UpdatePreferencesRequest` (application/json) |
| Headers | `X-User-Id: <uuid>` |
| Success | `200 OK` |
| Validation Error | `400 Bad Request` → `StandardError` |

---

### 2.4 POST /v1/contribute

| Item | Value |
|---|---|
| Method | POST |
| Path | `/v1/contribute` |
| Content-Type | `multipart/form-data` |
| Form Fields | `barcode: string`, `image: File` |
| Success | `202 Accepted` → `{ status: "ACCEPTED", message: string, barcode: string }` |
| Payload Too Large | `413` → `StandardError` |

**TypeScript usage:**
```typescript
// src/api/contribute.ts
export const submitContribution = async (
  barcode: string,
  imageUri: string
): Promise<void> => {
  const formData = new FormData();
  formData.append("barcode", barcode);
  formData.append("image", {
    uri: imageUri,
    name: "product.jpg",
    type: "image/jpeg",
  } as unknown as Blob);
  await apiClient.post("/v1/contribute", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};
```

---

## 3. Axios Client Configuration

```typescript
// src/api/client.ts
import axios from "axios";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8080";
const TIMEOUT_MS = parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT_MS ?? "5000");

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: TIMEOUT_MS,
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// Interceptor: Đính kèm X-User-Id từ AsyncStorage (MVP)
apiClient.interceptors.request.use(async (config) => {
  const userId = await AsyncStorage.getItem("userId");
  if (userId) config.headers["X-User-Id"] = userId;
  return config;
});

// Interceptor: Log lỗi + chuẩn hóa error type
apiClient.interceptors.response.use(
  (res) => res,
  (error) => {
    const standardError: StandardError = error.response?.data ?? {
      errorCode: "NETWORK_ERROR",
      message: "Không thể kết nối tới server",
      traceId: "unknown",
    };
    return Promise.reject(standardError);
  }
);
```

---

## 4. TanStack Query Keys Convention

```typescript
// Quy ước key để tránh cache collision
export const queryKeys = {
  product: (barcode: string) => ["product", barcode] as const,
  history: (page: number) => ["history", page] as const,
  preferences: () => ["preferences"] as const,
} as const;
```

---

## 5. Error Handling Convention

| HTTP Status | Frontend Action |
|---|---|
| `200` | Render data |
| `404` | Điều hướng sang ContributeScreen |
| `400` | Hiển thị validation error inline |
| `503` | Hiển thị ErrorBanner toàn màn hình với nút "Thử lại" |
| Network Timeout | Hiển thị toast "Mất kết nối mạng" |
