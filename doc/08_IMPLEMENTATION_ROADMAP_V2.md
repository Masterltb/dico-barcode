# Lộ trình Triển khai MVP - Implementation Roadmap V2 (Detailed Execution Guide for AI Agents)

Tài liệu này là **Kim chỉ nam thực thi (Execution Guide)** phân rã chi tiết từng tính năng thành các micro-steps chuẩn Production. AI Agent hoặc Lập trình viên **bắt buộc phải check-off từng ô một (tickbox)** theo đúng thứ tự để đảm bảo hiệu năng, chống N+1 query, và chống sập Connection Pool.

---

## 🚀 Sprint 1: Nền tảng Core & Data Bridge (Foundation)
**Mục tiêu:** Xây dựng xong bộ sườn Serverless Backend, kết nối Database, và tích hợp chuẩn xác với OpenFoodFacts (OFF). Chưa có logic tính điểm, chưa có AI.

### Task 1.1: Khởi tạo Project & CSDL
- [ ] **1.1.1.** Khởi tạo project Spring Boot 3.x (Java 21) với các dependencies: `Web`, `Data JPA`, `PostgreSQL`, `Validation`, `Actuator`, `Lombok`, `Flyway`.
- [ ] **1.1.2.** Tạo file `V1__init_schema.sql` trong `src/main/resources/db/migration`. Định nghĩa 3 bảng `users`, `products`, `scan_history` chuẩn PostgreSQL (Sử dụng `VARCHAR`, `JSONB` cho payload). Tối thiểu khởi tạo Index GIN cho `users.preferences`.
- [ ] **1.1.3.** Chạy ứng dụng lần đầu kết nối với Local PostgreSQL để Flyway gen bảng tự động.

### Task 1.2: Xây dựng Core Entities & Repositories (Quy tắc 09 phải áp dụng)
- [ ] **1.2.1.** Tạo Entity `User`, `Product`, `ScanHistory`. Tuyệt đối **không** khai báo `@OneToMany List<ScanHistory>` trong `User`. Chỉ cấu hình Unidirectional từ Entity con (`@ManyToOne` trong `ScanHistory`).
- [ ] **1.2.2.** Đảm bảo kiểu dữ liệu `product_data_payload` (JSONB của bảng Products) được mapping custom bằng thư viện `vladmihalcea:hibernate-types` hoặc native JPA 3 converter sang class `com.fasterxml.jackson.databind.JsonNode`.
- [ ] **1.2.3.** Tạo `ProductRepository`. Định nghĩa interface DTO Projection để fetch sản phẩm (`ProductSummaryView`). Cấm dùng `findAll()` trả ra entity list nguyên gốc.

### Task 1.3: Tích hợp OpenFoodFacts Client (Spec 07)
- [ ] **1.3.1.** Thêm dependency thư viện `Resilience4j` (CircuitBreaker, Retry).
- [ ] **1.3.2.** Tạo `OpenFoodFactsClient` dùng `RestTemplate` hoặc `WebClient`. Setup cấu hình timeout trong `application.yml` (Connect: 1000ms, Read: 3000ms).
- [ ] **1.3.3.** Cài đặt `@Retry(name = "offApi")` và `@CircuitBreaker(name = "offApi", fallbackMethod = "offFallback")`. Setup retry chỉ bám vào Exception `5xx` hoặc `TimeoutException`, không retry `4xx`.
- [ ] **1.3.4.** Xây dựng hàm parser `OffResponseParser`: Extract giá trị an toàn (Chống NullPointerExceptions tại các trường `nutriments`, `allergens_hierarchy`).

**💡 Definition of Done (DoD - Sprint 1):**
- System chạy lên gọi được hàm OFF Client, in log thành công payload Product 8934567812 mà không ném lỗi Null.

---

## 🟢 Sprint 2: The Brain (Deterministic Scoring & API `/v1/products/{barcode}`)
**Mục tiêu:** Hoàn thiện luồng lấy sản phẩm và chấm điểm toán học, quyết định màu sắc. Đóng gói thành API chuẩn.

### Task 2.1: Bộ chấm điểm Độc lập (Pure Logic) (Spec 03)
- [ ] **2.1.1.** Tạo Class `ScoringEngineService` thuần Java (Không gọi CSDL, không autowired Repo).
- [ ] **2.1.2.** Viết hàm `CalculateResult calculateScore(OffProduct payload, UserPreferences userPrefs)`.
- [ ] **2.1.3.** Triển khai logic tính N_Nutri (40%), N_Nova (40%), N_Additives (20%).
- [ ] **2.1.4.** Triển khai hàm Override 1 (Blacklist Additives) và Override 2 (Allergy Conflict) để ép điểm `<40` và màu `RED`.
- [ ] **2.1.5.** Viết Unit Test `ScoringEngineServiceTest` coverage 100%. Assert chắc chắn nếu chứa hạt Peanut thì auto màu RED.

### Task 2.2: Lắp ráp API Gateway `/v1/products/{barcode}`
- [ ] **2.2.1.** Tạo DTO `ProductEvaluationResponse` đúng chuẩn Swagger Spec 06.
- [ ] **2.2.2.** Tạo `ProductApplicationService` orchestrator method với LUỒNG CHUẨN như sau:
  - [ ] *Bước 1:* Gọi DB kiểm tra cache (`ProductRepository.findById`). Nếu có -> Check thời hạn (TTL < 3 tháng) -> Return luôn (Cache Hit).
  - [ ] *Bước 2:* Nếu Cache Miss -> **Mở Network call tới OFF**. (⚠️ Không bọc hàm gọi OFF trong `@Transactional` để tránh giam giữ connection pool).
  - [ ] *Bước 3:* Nhận response OFF -> Xử lý lỗi (Nếu 404 throw Custom Exception).
  - [ ] *Bước 4:* Truyền payload vào `ScoringEngineService` để lấy màu sắc và điểm số.
  - [ ] *Bước 5:* Mở transaction DB mới (`@Transactional(propagation = Propagation.REQUIRES_NEW)`) lưu thông tin Product cùng với điểm số vào database. Chú ý set `ai_summary_cache` = null.
- [ ] **2.2.3.** Tạo `GlobalExceptionHandler` bắt lỗi văng từ tầng dưới và trả ra cấu trúc `StandardError` có `trace_id`.

### Task 2.3: API Quản lý Người dùng `/v1/users/me/preferences`
- [ ] **2.3.1.** Tạo DTO `UpdatePreferencesRequest` (Chứa array `allergies` và string `diet`).
- [ ] **2.3.2.** Implement Cập nhật DB (Toàn vẹn Transaction, Hibernate Lifecycle).

**💡 Definition of Done (DoD - Sprint 2):**
- API `/v1/products/{barcode}` chạy thành công. Phản hồi < 200ms với Data local và < 2.5s với Data phải qua OFF. Có đủ màu sắc và Overrides.

---

## 🤖 Sprint 3: AI Inference & Edge APIs
**Mục tiêu:** Tích hợp bộ não AI sinh tóm tắt (<50 từ) dạng JSON an toàn, giải quyết bài toán Rate Limit.

### Task 3.1: Gọi Gemini 1.5 Flash (Spec 04)
- [ ] **3.1.1.** Cài đặt SDK sinh text (vd `spring-ai-vertex-ai-gemini-spring-boot-starter` hoặc gọi HTTP thủ công).
- [ ] **3.1.2.** Triển khai `AiAnalysisClientService`. Gói gọn System Prompt (Ép JSON mode rủi ro).
- [ ] **3.1.3.** Cài đặt Timeout Exception = `2000ms` tại Client. Cài đặt `@Retry` Max 1 turn nếu HTTP timeout, quá thì ném `AiTimeoutException`. Fallback trả về Empty Object không nổ App.

### Task 3.2: Ghép AI vào Luồng Product API gốc (Trí mạng)
- [ ] **3.2.1.** Cập nhật Orchestrator `ProductApplicationService`. Đứng sau *Bước 5* của Task 2.2.2.
- [ ] **3.2.2.** So khớp `SHA256(ingredients_text)`. Nếu trùng rớt vào `ai_summary_cache` -> Lấy luôn Tóm tắt DB (AI Cache Hit).
- [ ] **3.2.3.** Nếu AI Cache Miss -> Gọi `AiAnalysisClientService`. (⚠️ Lại một lần nữa: Hàm gọi GPT KHÔNG được bọc trong `@Transactional`).
- [ ] **3.2.4.** Lấy được `ai_summary` -> Mở Update Transaction ghi đè vào DB -> Trả về JSON cho Mobile. (Tổng thời gian < 2 giây rưỡi).

### Task 3.3: API Đóng góp & Async / Rate Limit
- [ ] **3.3.1.** Tạo API POST `/v1/contribute` nhận multipart file. Upload thẳng Google Cloud Storage. Trả HTTP 202.
- [ ] **3.3.2.** Áp dụng `Bucket4j` trên tầng Interceptor (Rate limit 20 req/minute/IP) vào endpoint Analyse của Product API để chống phá hoại ngân sách Gemini.

**💡 Definition of Done (DoD - Sprint 3):**
- Gọi Barcode API ra Full Body: Data chuẩn xác Deterministic + AI_Summary tự nhiên (< 50 từ). Nếu Model sập/quá tải, API vẫn trả 200 OK với màu sắc xanh đỏ vàng đúng, chỉ để trống field `ai_summary`.

---

## 🚀 Sprint 4: CI/CD & Production Deployment
**Mục tiêu:** Đóng gói, triển khai, theo dõi.

### Task 4.1: Dockerization
- [ ] **4.1.1.** Viết `Dockerfile` base image `eclipse-temurin:21-jre-alpine`. Build theo cơ chế Multi-stage hoặc Spring Boot Native Image.
- [ ] **4.1.2.** Viết `docker-compose.yml` để mock test môi trường DB local giả lập Cloud SQL.
### Task 4.2: CI/CD Pipeline
- [ ] **4.2.1.** Khởi tạo file `.github/workflows/deploy.yml`: Các bước build Maven, chạy Checkstyle, chạy Tests (Chứa hàm check N+1 sql assert). Push tệp image lên Google Artifact Registry.
### Task 4.3: Deploy GCP
- [ ] **4.3.1.** Cấu hình App Deploy lên **Google Cloud Run**, gắn network giao tiếp internal với **Cloud SQL PostgreSQL**. Cấu hình Secret Manager cho các giá trị nhạy cảm (JWT Secret, API Key OFF, Gemini Key, DB Password).
