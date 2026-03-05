# Business Requirements Document - MVP V2 (Cập nhật)

## 1. Tổng quan MVP
**DICO Scan MVP** nhằm mục đích rút ngắn thời gian cảnh báo rủi ro sản phẩm cho người tiêu dùng xuống **dưới 2 giây** thông qua cơ chế quét Barcode. Hệ thống hỗ trợ **đa danh mục sản phẩm** (Thực phẩm, Đồ chơi, Mỹ phẩm, Thời trang) với **2 gói dịch vụ** (FREE/PREMIUM).

## 2. In-Scope / Out-of-Scope
| Tiêu chí | MVP (Đã Triển khai) | Tương lai (Phase 2+) | Ghi chú |
| :--- | :--- | :--- | :--- |
| Nguồn Dữ liệu | OFF API (REST) + Cache DB nội bộ. | GS1 Việt Nam, thêm data sources. | |
| Cơ chế Scorer | Deterministic Scoring: N_score/Nova/Additives + Multi-category. | ML phân tích mức sống. | |
| Vai trò LLM | Tóm tắt rủi ro < 50 từ (JSON). Category-specific prompts. | Chatbot tương tác AI Coach. | |
| Hồ sơ người dùng | Safety Profile wizard 8 bước: allergies, skin type, health, diet. Child/Pregnancy branches. | Apple Health/Google Fit. | PREMIUM only |
| Đăng ký/Đăng nhập | Email + Password, JWT token, BCrypt hash. | OAuth2 (Google/Apple). | |
| Gói dịch vụ | FREE (generic) / PREMIUM (personalized). | In-App Purchase integration. | `SubscriptionTier` enum |
| Đa danh mục | FOOD, TOY, BEAUTY, FASHION, GENERAL. | Thêm categories mới. | `ProductCategory` enum |
| Đóng góp dữ liệu | Upload ảnh → 202 Accepted (stub). | GCS + async OCR Pub/Sub. | |

## 3. Core Workflow

### Luồng 1: Scan Barcode (Đa danh mục + Tier-gated)
- Trigger: Người dùng quét mã EAN-8 đến EAN-14.
- Action: `GET /v1/products/{barcode}` với header `X-User-Id`.
- System process (7 bước Orchestrator):
  1. Load User → xác định Tier (FREE/PREMIUM)
  2. Cache Check trong DB PostgreSQL → nếu fresh → trả ngay (< 200ms)
  3. Cache Miss → gọi OpenFoodFacts API
  4. Phát hiện danh mục sản phẩm (CategoryDetector)
  5. Deterministic Scoring (0-100) + Overrides
  6. Persist kết quả vào DB
  7. Gọi AI Gemini → lấy summary → cập nhật DB → trả response

### Luồng 2: Đăng ký / Đăng nhập
- `POST /v1/auth/register` → Tạo user (FREE mặc định) → JWT token
- `POST /v1/auth/login` → Xác thực → JWT token

### Luồng 3: Safety Profile (PREMIUM)
- `PUT /v1/users/me/safety-profile` → Lưu questionnaire 8 bước
- `GET /v1/users/me/safety-profile` → Xem hồ sơ hiện tại

## 4. Acceptance Criteria

### 4.1. Performance Objectives (SLOs)
- `P95` Latency Cache Hit `/v1/products/{barcode}`: `< 200ms`.
- `P95` Latency Cache Miss (OFF + AI): `< 2500ms`.
- Fallback Timeout: AI > 2000ms → trả Score không có AI summary.

### 4.2. Functional Objectives
- **AC_01**: PREMIUM user có "Peanut" trong safety profile → sản phẩm chứa peanut phải trả `RED` + `override_reasons`.
- **AC_02**: Sản phẩm có `Final_Score < 40` → màu `RED`.
- **AC_03**: FREE user → không thấy personal allergy conflicts trong `overrideReasons`.
- **AC_04**: Sản phẩm TOY → hiển thị categoryWarning về giới hạn tuổi.
- **AC_05**: Sản phẩm BEAUTY → hiển thị cảnh báo thành phần kích ứng.

### 4.3. Security & Compliance
- **SEC_01**: Password → BCrypt hash. JWT token (HS256).
- **SEC_02**: Safety Profile inputs → sanitize HTML, strip dangerous chars, limit length.
- **SEC_03**: PREMIUM-gated endpoints (preferences, safety-profile) → 403 cho FREE users.
