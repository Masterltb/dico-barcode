# Báo cáo Phân tích & Đề xuất Mở rộng Tính năng

> Dựa trên phân tích toàn bộ source code thực tế (Backend + Mobile).  
> Phân loại theo **Impact** (tác động) × **Effort** (công sức).

---

## Tổng quan Hệ thống hiện tại

```
Backend ✅         Mobile ✅
─────────────────   ──────────────────────
Auth (JWT)          AuthScreen (Login/Register)
Product Scan        HomeScreen (Camera Scan)
Safety Profile      Wizard (8 screens)
Preferences         PreferencesScreen (FULL)
Scan History API    HistoryScreen (FULL)
Category Detect     ResultScreen
Gemini AI           ContributeScreen
```

**Gaps rõ ràng:**
- `HomeScreen.recentItems` = luôn `[]` (hardcode, không load từ API)
- `ResultScreen` thiếu: share, so sánh sản phẩm, ingredients chi tiết
- Không có Push Notification
- Không có Subscription Upgrade flow

---

## 🔴 Priority 1 — Quick Wins (Effort thấp, Impact cao)

### 1.1 Fix HomeScreen — "Quét gần đây" trống
**Vấn đề:** `recentItems` luôn là `[]` — section "Quét gần đây" chưa bao giờ hiển thị dữ liệu.  
**Fix:** Load 5 item gần nhất từ API `GET /v1/users/me/scan-history?size=5` nếu user đã đăng nhập.

```
File: src/screens/HomeScreen.tsx
Thêm: useQuery({ queryKey: queryKeys.history(0), queryFn: () => getScanHistory(0, 5) })
      Chỉ hiện khi user đã login (kiểm tra useAuthStore().token)
```

---

### 1.2 ResultScreen — Nút Share kết quả
**Vấn đề:** Không có cách chia sẻ kết quả scan với ai khác.  
**Fix:** Thêm nút "📤 Chia sẻ" dùng `expo-sharing` + `expo-file-system`.

```
Nội dung share: "Tôi vừa quét [Tên sản phẩm] trên DICO Scan → [🟢 AN TOÀN / 🔴 NGUY HIỂM]"
Kèm: AI summary ngắn
```

---

### 1.3 ResultScreen — Hiển thị thành phần (Ingredients)
**Vấn đề:** `ResultScreen` hiện tại không hiển thị danh sách thành phần — người dùng không thể tự đọc nhãn.  
**Fix:** Backend đã lưu `off_payload` JSONB có `ingredients_text`. Cần expose qua API response.

```
Backend: Thêm `ingredientsText` vào ProductEvaluationResponse
Mobile:  Thêm section "📋 Thành phần" expandable/collapsible trong ResultScreen
```

---

### 1.4 Offline Scan Cache — Xem lại kết quả không cần mạng
**Vấn đề:** Mở lịch sử → tap vào sản phẩm → gọi API lại. Nếu không có mạng → lỗi.  
**Fix:** Cache kết quả scan vào `AsyncStorage` bằng `react-query persistQueryClient`.

```
File: App.tsx (thêm persist client)
Benefit: Xem lại kết quả sản phẩm khi offline
```

---

## 🟡 Priority 2 — Core Features (Effort trung bình, Impact cao)

### 2.1 Subscription Upgrade Flow
**Vấn đề:** User FREE muốn nâng cấp PREMIUM không có cách nào trong app.  
**Backend cần:**
```
POST /v1/subscriptions/upgrade   ← Tạo mới
Body: { tier: "PREMIUM" }        ← Dev mode: upgrade ngay (Production: link tới payment)
```
**Mobile cần:**
```
UpgradeScreen.tsx — Màn hình giới thiệu benefit PREMIUM + nút Nâng cấp
Trigger: từ PreferencesScreen (FREE user tap vào locked feature)
```

---

### 2.2 Product Comparison — So sánh 2 sản phẩm
**Vấn đề:** User muốn chọn giữa 2 sản phẩm tương tự không thể so sánh.  
**Backend:** Không cần thay đổi — dùng 2 lần `GET /v1/products/{barcode}`.  
**Mobile cần:**
```
CompareScreen.tsx — 2 cột side-by-side
Trigger: Nút "⚖️ So sánh" trong ResultScreen → chọn sản phẩm 2 từ lịch sử
Fields so sánh: Rating, Score, AI summary, Allergens
```

---

### 2.3 Smart Search — Tìm kiếm sản phẩm đã quét
**Vấn đề:** HistoryScreen chỉ filter theo màu, không tìm kiếm theo tên.  
**Backend cần:**
```sql
-- ScanHistoryRepository: thêm query với JOIN products để tìm theo tên
@Query("SELECT ... FROM ScanHistory s JOIN Product p ON s.barcode = p.barcode 
        WHERE s.userId = :userId AND LOWER(p.name) LIKE LOWER(:keyword)")
```
**Mobile cần:**
```
SearchBar component trong HistoryScreen (debounce 300ms)
```

---

### 2.4 Allergy Alert Badge — Cảnh báo nhanh trên HomeScreen
**Vấn đề:** User nhìn vào HomeScreen không biết Profile của mình đang ở trạng thái gì.  
**Fix:** Hiển thị mini-badge trên HomeScreen góc trên:
```
Nếu PREMIUM + profile completed: "🛡️ Đang bảo vệ bạn"
Nếu PREMIUM + chưa setup:        "⚠️ Hoàn thiện hồ sơ"
Nếu FREE:                         "🔒 Nâng cấp để cá nhân hóa"
```

---

## 🟢 Priority 3 — Advanced Features (Effort cao, Impact cao dài hạn)

### 3.1 Push Notification — Cảnh báo recall sản phẩm
**Use case:** Khi một sản phẩm trong lịch sử quét bị thu hồi hoặc cập nhật rating.  
**Backend cần:**
```
POST /v1/notifications/fcm  ← Tích hợp Firebase Cloud Messaging
Trigger: Khi product.rating thay đổi từ GREEN → RED
```
**Mobile cần:** `expo-notifications` setup

---

### 3.2 Scan Statistics Dashboard — Thống kê sức khỏe cá nhân
**Use case:** Sau 30 ngày quét, muốn biết "tôi ăn uống lành mạnh không?"  
**Backend cần:**
```
GET /v1/users/me/stats
Response: {
  totalScanned: 47,
  greenPercent: 62,
  topAllergenHit: "gluten",
  mostScannedBrand: "Vinamilk",
  riskiestCategory: "FOOD (processed)"
}
```

---

### 3.3 Contribution Rewards — Gamification
**Use case:** Khuyến khích user đóng góp ảnh sản phẩm chưa có.  
**Backend cần:**
```
Thêm cột users.contribution_points INT
POST /v1/contribute → tăng điểm +10
GET /v1/users/me/profile → trả về điểm + rank
```
**Mobile:** Badge điểm + leaderboard đơn giản

---

### 3.4 Wishlist / Favorites — Danh sách yêu thích
**Use case:** Đánh dấu sản phẩm "Mua lại" hoặc "Tránh mua".  
**Backend cần:**
```sql
-- Bảng mới: user_favorites
CREATE TABLE user_favorites (
  user_id UUID, barcode VARCHAR(14), 
  label VARCHAR(20), -- 'SAFE' | 'AVOID'
  added_at TIMESTAMPTZ
);
```

---

## 🔵 Priority 4 — Production Hardening (Từ Sprint 4 doc)

| # | Task | File cần sửa |
|---|------|-------------|
| 4.1 | Resilience4j Circuit Breaker cho OFF/Gemini | `OpenFoodFactsClient.java`, `GeminiClient.java` |
| 4.2 | Rate Limiting 20 req/min/IP | `SecurityConfig.java` + Bucket4j |
| 4.3 | Unit Tests ScoringEngine | `ScoringEngineServiceTest.java` |
| 4.4 | CI/CD GitHub Actions | `.github/workflows/deploy.yml` |
| 4.5 | API Key rotation | `application.yaml` + Secret Manager |

---

## Đề xuất Thứ tự Triển khai

```
Tuần 1:  1.1 (HomeScreen recent)  +  1.3 (Ingredients)  +  1.2 (Share)
Tuần 2:  2.1 (Upgrade flow)       +  2.4 (Allergy badge)
Tuần 3:  2.2 (Compare)            +  2.3 (Search history)
Tuần 4:  4.1 + 4.2 + 4.3 (Production hardening)
Tháng 2: 3.1 (Notification)       +  3.2 (Stats)       +  3.4 (Favorites)
```

---

## Ma trận Quyết định

```
         │ Impact Cao        │ Impact Thấp
─────────┼───────────────────┼────────────────────
Effort   │ 1.1 HomeScreen    │ 1.4 Offline cache
Thấp     │ 1.2 Share         │ 2.4 Alert badge
         │ 1.3 Ingredients   │
─────────┼───────────────────┼────────────────────
Effort   │ 2.1 Upgrade flow  │ 3.3 Gamification
Cao      │ 2.2 Compare       │ 3.4 Favorites
         │ 3.1 Notification  │
         │ 3.2 Stats         │
```

> **Khuyến nghị bắt đầu ngay:** `1.1` (15 phút) → `1.3` (30 phút) → `2.1` (2 giờ)
