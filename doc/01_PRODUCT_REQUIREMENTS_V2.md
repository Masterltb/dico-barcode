# Business Requirements Document - MVP V2

## 1. Tổng quan MVP
**DICO Scan MVP** nhằm mục đích rút ngắn thời gian cảnh báo rủi ro thực phẩm cho người tiêu dùng xuống **dưới 2 giây** thông qua cơ chế quét Barcode (tập trung tại quầy siêu thị).

## 2. In-Scope / Out-of-Scope (Ranh giới MVP)
| Tiêu chí | MVP (Phase 1 - In Scope) | Tương lai (Phase 2+ - Out of Scope) | Căn cứ ràng buộc |
| :--- | :--- | :--- | :--- |
| Nguồn Dữ liệu | Lấy trực tiếp từ OFF API (REST). Cache DB nội bộ. | Thu mua dữ liệu từ GS1 Việt Nam. | Tiết kiệm chi phí đầu vào. |
| Cơ chế Scorer | Deterministic Scoring với N_score, Nova, Additives. | Scoring dựa trên ML phân tích mức sống. | Phase 1 bắt buộc dùng toán deterministic. |
| Vai trò LLM | Tóm tắt điểm yếu (< 50 từ). Trả về JSON chuẩn. | Chatbot tương tác tự do với AI Coach. | Chỉ định đoạt AI_SUMMARY, chống sinh nội dung ảo (hallucination).|
| Hồ sơ người dùng | Thiết lập tối đa 5 loại dị ứng (Allergens) dạng tags, 1 Diet type (JSONB). | Kết nối Apple Health/Google Fit, Medical records. | Database chỉ lưu `user.preferences.allergies`. |
| Thanh toán | Đăng ký tài khoản miễn phí. API xử lý public/auth headers. | Subscription/VIP qua iOS/AOS In-App Purchase. | Chưa triển khai module Account Balance/Payments. |
| Trải nghiệm xử lý thiếu mã vạch| Hiển thị `UNKNWON` + Yêu cầu cung cấp ảnh (đẩy cất lên Cloud Storage). | Nhận diện Camera thời gian thực OCR trên Mobile (Live Scanner).| Bỏ qua quy trình ML OCR trực tiếp ở MVP, xử lý off-cloud (async worker). |

## 3. Core Workflow (Chấp nhận Tiêu chuẩn MVP)
**Luồng 1: Scan Barcode Thành công**
- Trigger: Người dùng quét 1 mã EAN-13 (vd: `8934567890123`).
- Action: Mobile App Request: `GET /v1/products/8934567890123`
- System process:
  - Cache Hit: Có trong DB PostgreSQL -> Trả ngay (<200ms).
  - Cache Miss: API Backend gọi OFF. Nếu OFF có -> Calculate Scoring (0-100) -> Calculate Color -> Trigger AI (Timeout 2000ms) để lấy Summary -> Response Mobile.
- User Criteria (Thành công): System trả về 1 thẻ màu xanh/vàng hoặc đỏ, điểm chuẩn tổng, list additive cảnh báo (nếu có), tóm tắt chữ tiếng Việt.

## 4. Acceptance Criteria (Tiêu chí Nghiệm thu Hệ thống Kỹ thuật)
### 4.1. Performance Objectives (SLOs)
- `P95` Latency cho Cache Hit Endpoint `/v1/products/{barcode}`: `< 200ms`.
- `P95` Latency cho Cache Miss (Gọi OFF + Gọi AI Inference): `< 2500ms`.
- System Fallback Timeout: Nếu gọi AI inference vượt 2000ms -> Ngắt request, trả về Color Deterministic Score giữ nguyên tính chính xác (AI_summary = null).

### 4.2. Functional Objectives
- **AC_01**: Nếu sản phẩm có chứa "Peanut" và `user.preferences.allergies` có chứa "peanut" => System phải trả về `override_reasons` mảng có phần tử "Allergy Conflict: peanut" VÀ màu BẮT BUỘC trả về `RED`.
- **AC_02**: Bất kỳ sản phẩm nào có `N_Score + N_Nova + N_Additives < 40` đều trả về màu `RED`.

### 4.3. Security & Compliance
- **SEC_01**: Không lưu mật khẩu raw. Cấp token JWT (RS256) hiệu lực 30 ngày.
- **SEC_02**: Mọi request đến `/v1/evaluate` đều bị kiểm soát bởi Rate Limiting (Tối đa 20 request/phút/IP) để tránh DOS cạn kiệt tài khoản Gemini Cloud API.
