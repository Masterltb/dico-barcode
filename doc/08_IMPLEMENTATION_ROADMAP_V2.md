# Lộ trình Triển khai — Implementation Roadmap V2 (Cập nhật)

Tài liệu này là **Kim chỉ nam thực thi** phân rã chi tiết từng tính năng. Đánh dấu `[x]` = hoàn thành, `[ ]` = chưa triển khai.

---

## ✅ Sprint 1: Nền tảng Core & Data Bridge (HOÀN THÀNH)
**Mục tiêu:** Backend foundation, DB, OpenFoodFacts Client.

### Task 1.1: Khởi tạo Project & CSDL
- [x] **1.1.1.** Spring Boot 3.x (Java 21): Web, Data JPA, PostgreSQL, Validation, Actuator, Lombok, Flyway.
- [x] **1.1.2.** `V1__init_schema.sql`: 3 bảng `users`, `products`, `scan_history` + GIN Index.
- [x] **1.1.3.** Flyway migrations chạy thành công (V1 → V4).

### Task 1.2: Core Entities & Repositories
- [x] **1.2.1.** Entities: `User`, `Product`, `ScanHistory`. Unidirectional only (Guardrail Rule 2).
- [x] **1.2.2.** JSONB mapping: `@JdbcTypeCode(SqlTypes.JSON)` cho `off_payload`, `preferences`, `safety_profile`.
- [x] **1.2.3.** `ProductRepository`, `UserRepository`, `ScanHistoryRepository`.

### Task 1.3: OpenFoodFacts Client
- [x] **1.3.1.** `OpenFoodFactsClient` với RestTemplate + timeout config.
- [x] **1.3.2.** `OffResponseParser`: Extract an toàn (null safety).
- [x] **1.3.3.** `OffProductData` record: barcode, name, brand, nutriscoreGrade, novaGroup, additivesTags, etc.
- [ ] **1.3.4.** Resilience4j `@CircuitBreaker` + `@Retry` annotations (CHƯA — đang dùng try/catch thủ công).

---

## ✅ Sprint 2: Scoring Engine & Core API (HOÀN THÀNH)

### Task 2.1: Deterministic Scoring Engine
- [x] **2.1.1.** `ScoringEngineService` — Pure Java, zero I/O.
- [x] **2.1.2.** Formula: `(N_Nutri*0.4) + (N_Nova*0.4) + (N_Additives*0.2)`.
- [x] **2.1.3.** Override O1 (Blacklist Additives), O2 (Allergy Conflict), O3 (Missing Data).
- [x] **2.1.4.** `AdditiveRiskRegistry` — phân loại HIGH/MEDIUM/LOW.
- [ ] **2.1.5.** Unit Test `ScoringEngineServiceTest` coverage 100% (CHƯA).

### Task 2.2: API Gateway `/v1/products/{barcode}`
- [x] **2.2.1.** `ProductEvaluationResponse` — đầy đủ fields (rating, score, aiSummary, category, categoryWarning, riskFactors).
- [x] **2.2.2.** `ProductApplicationService` orchestrator 7 bước.
- [x] **2.2.3.** `ProductPersistService` — tách `@Transactional` operations (Guardrail Rule 6).
- [x] **2.2.4.** `GlobalExceptionHandler` — StandardError response.

### Task 2.3: User Preferences
- [x] **2.3.1.** `UpdatePreferencesRequest` (allergies + diet).
- [x] **2.3.2.** `UserService.updatePreferences()` — entity load/save (Hibernate JSONB mapping).

---

## ✅ Sprint 3: AI + Auth + Premium Features (HOÀN THÀNH)

### Task 3.1: Gemini 1.5 Flash Integration
- [x] **3.1.1.** `GeminiClient` — HTTP client gọi Gemini API.
- [x] **3.1.2.** Category-specific prompt templates (FOOD/TOY/BEAUTY/FASHION).
- [x] **3.1.3.** `AiAnalysisResult` record (aiSummary, detectedAllergies, riskIngredients).
- [x] **3.1.4.** AI Cache: SHA-256 hash đối chiếu `ai_inputs_hash`.
- [x] **3.1.5.** Timeout 2000ms → fallback empty AI summary.

### Task 3.2: Authentication
- [x] **3.2.1.** `AuthController` — `/v1/auth/register`, `/v1/auth/login`.
- [x] **3.2.2.** `AuthService` — BCrypt password hashing, JWT generation.
- [x] **3.2.3.** `JwtUtil` — token generation/validation.
- [x] **3.2.4.** `RegisterRequest`, `LoginRequest`, `AuthResponse` DTOs.

### Task 3.3: Subscription Tier Gating
- [x] **3.3.1.** `SubscriptionTier` enum (FREE/PREMIUM).
- [x] **3.3.2.** Tier gating trong `ProductApplicationService` — FREE users không có personal overrides.
- [x] **3.3.3.** `PremiumRequiredException` + 403 response.

### Task 3.4: Safety Profile Wizard (Premium)
- [x] **3.4.1.** `SafetyProfileController` — PUT/GET `/v1/users/me/safety-profile`.
- [x] **3.4.2.** `SafetyProfileService` — data sanitization, persistence.
- [x] **3.4.3.** `SaveSafetyProfileRequest` — 8-screen validation (targets, allergies, skin, health, diet).
- [x] **3.4.4.** `SafetyProfileResponse` — fromMap factory method.
- [x] **3.4.5.** Child/Pregnancy conditional branches.

### Task 3.5: Multi-Category Detection
- [x] **3.5.1.** `ProductCategory` enum (FOOD/TOY/BEAUTY/FASHION/GENERAL).
- [x] **3.5.2.** `ProductCategoryDetector` — phân loại từ `categories_tags`.
- [x] **3.5.3.** Category-specific warnings trong response.

### Task 3.6: Contribution API
- [x] **3.6.1.** `ContributionController` — `POST /v1/contribute` multipart upload → 202.
- [ ] **3.6.2.** GCS Upload + Pub/Sub trigger (CHƯA — stub only).

---

## 🔲 Sprint 4: Production Hardening (CHƯA TRIỂN KHAI)

### Task 4.1: Resilience & Rate Limiting
- [ ] **4.1.1.** Tích hợp Resilience4j `@CircuitBreaker` + `@Retry` cho OFF Client.
- [ ] **4.1.2.** Áp dụng `Bucket4j` Rate Limiting (20 req/min/IP).
- [ ] **4.1.3.** Caffeine Local Cache cho sản phẩm hot.

### Task 4.2: Testing
- [ ] **4.2.1.** Unit Test `ScoringEngineServiceTest` — 100% coverage.
- [ ] **4.2.2.** Integration Test — kiểm tra N+1 query.
- [ ] **4.2.3.** API Test — test tất cả 7 endpoints.

### Task 4.3: Subscription Management
- [ ] **4.3.1.** API upgrade FREE → PREMIUM (endpoint mới).
- [ ] **4.3.2.** Scan History API — GET endpoint cho mobile.

### Task 4.4: Docker & CI/CD
- [x] **4.4.1.** `Dockerfile` (eclipse-temurin:21-jre-alpine, multi-stage build).
- [x] **4.4.2.** `docker-compose.yml` (PostgreSQL + Backend).
- [ ] **4.4.3.** `.github/workflows/deploy.yml` — CI/CD pipeline.

### Task 4.5: Deploy GCP
- [ ] **4.5.1.** Cloud Run deployment + Cloud SQL config.
- [ ] **4.5.2.** Secret Manager (JWT key, API keys, DB password).
- [ ] **4.5.3.** Monitoring + Alerting setup.
