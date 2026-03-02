# DICO Scan - Tổng quan Hệ thống Dự án V2

## 1. Mục đích Tài liệu
Bộ tài liệu V2 ("Production-Grade") được biên soạn lại với mục tiêu định nghĩa chính xác và rõ ràng toàn bộ logic của hệ thống **DICO Scan**. Không chấp nhận sự diễn giải mơ hồ ("hallucination" hoặc "guessing"). Đội ngũ kỹ sư, đặc biệt là các AI Agent khi tham gia dự án, bắt buộc phải tuân theo hệ thống scoring có khối lượng tính toán (deterministic) trước khi áp dụng AI.

## 2. Các lớp của hệ thống (System Layers)
Kiến trúc DICO Scan phân tách rõ ràng trách nhiệm của 3 lớp để đảm bảo an toàn, tốc độ và tính chính xác, phân phối như sau:

1. **Lớp Deterministic Scoring Engine (Ưu tiên Cao nhất):**
   - Đánh giá sản phẩm thông qua công thức toán học và tập luật (rulesets) đã định sẵn. 
   - Đầu ra duy nhất là kết quả phân loại XANH/VÀNG/ĐỎ hợp lệ.
   - Bất kỳ thành phần nào vi phạm rule (Allergy conflict, Banned additive) tự động bị hạ cấp mà không cần hỏi ý kiến AI.
2. **Lớp AI Explanation (Chỉ định):**
   - Sử dụng LLM để sinh ra đoạn tóm tắt < 50 từ về rủi ro của sản phẩm, giúp người dùng dễ hiểu.
   - LLM **không có quyền** override thẻ màu mà Scoring Engine đã quyết định.
3. **Lớp Recommendation (Phase 2+):**
   - Dựa vào lịch sử tiêu dùng, gợi ý các sản phẩm "Xanh" tương đương thay thế cho sản phẩm "Đỏ". Hiện tại không thuộc phạm vi MVP.

## 3. Technology Stack (Cập nhật V2)
- **Backend:** Spring Boot 3.x (Java 21). Môi trường chạy trên Google Cloud Run (Serverless).
- **Database:** PostgreSQL 16 (Cloud SQL) lưu trữ transactional data + JSONB. Flyway đảm nhiệm DB Migration.
- **Frontend/Mobile:** React Native (cho iOS & Android) - Mọi xử lý đồ họa/UI phải chịu dung sai xử lý dưới 50ms.
- **AI Model/Inference:** Gemini 1.5 Flash (chọn ưu tiên vì chi phí rẻ & context processing tốt), gọi trực tiếp từ backend.
- **Data Source Chính:** OpenFoodFacts API V2 (OFF).

## 4. Danh mục File V2 (File Map)
Bộ Tài liệu V2 bao gồm 9 file độc lập, không chồng chéo nhau trong việc quản trị requirements:
- `01_PRODUCT_REQUIREMENTS_V2.md`- Yêu cầu dự án, User Stories, Acceptance Criteria (AC).
- `02_SYSTEM_ARCHITECTURE_V2.md`- Sơ đồ kiến trúc mức hệ thống.
- `03_DETERMINISTIC_SCORING_ENGINE_V2.md`- Công thức, ngưỡng, và các luật override cấp màu sắc xanh/vàng/đỏ.
- `04_AI_INTEGRATION_CONTRACT_V2.md`- Quy chuẩn đầu ra/vào JSON cho LLM, System prompt và fallback.
- `05_DATA_DICTIONARY_ERD_V2.md`- Lược đồ Database mức vật lý (constraints, indexing).
- `06_API_SPECIFICATION_V2.yaml`- OpenAPI Spec.
- `07_EXTERNAL_INTEGRATION_OFF_V2.md`- Chính sách tương tác OpenFoodFacts API (Retry, Timeout).
- `08_IMPLEMENTATION_ROADMAP_V2.md`- Sprint checklist và Definition of Done (DoD) chuẩn của MVP.
