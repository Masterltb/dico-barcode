# AGENT GUIDE — Hướng dẫn Triển khai Tính năng Mới (Production-Ready)

> **Dành cho:** AI Agent, Developer mới, hoặc bất kỳ ai muốn thêm tính năng vào DICO Scan.
> **Nguyên tắc:** Đọc file này TRƯỚC KHI viết bất kỳ dòng code nào.

---

## 1. Bản đồ Dự án (Mental Map)

```
e:\exe101\
├── doc/                          ← TẤT CẢ Tài liệu kỹ thuật (đọc trước)
│   ├── memory.md                 ← Context ngắn gọn nhất — đọc đầu tiên
│   ├── 00_README_OVERVIEW_V2.md  ← Tổng quan hệ thống
│   ├── 01_PRODUCT_REQUIREMENTS_V2.md
│   ├── 02_SYSTEM_ARCHITECTURE_V2.md ← Kiến trúc + Service Map
│   ├── 03_DETERMINISTIC_SCORING_ENGINE_V2.md
│   ├── 04_AI_INTEGRATION_CONTRACT_V2.md
│   ├── 05_DATA_DICTIONARY_ERD_V2.md ← Schema DB (users/products/scan_history)
│   ├── 06_API_SPECIFICATION_V2.yaml  ← 7 endpoints OpenAPI
│   ├── 07_EXTERNAL_INTEGRATION_OFF_V2.md
│   ├── 08_IMPLEMENTATION_ROADMAP_V2.md ← Sprint checklist
│   ├── 09_TECHNICAL_GUARDRAILS_V2.md  ← Rules KHÔNG được vi phạm
│   ├── 15_SUBSCRIPTION_TIER_SPEC.md
│   ├── 16_SAFETY_PROFILE_SPEC.md
│   ├── 17_AUTH_SPEC.md
│   └── 18_MULTI_CATEGORY_SCORING_SPEC.md
│
├── dico-scan/                    ← Backend Spring Boot
│   └── src/main/java/com/dico/scan/
│       ├── controller/           ← REST endpoints (6 files)
│       ├── service/              ← Business logic (+ scoring/ subfolder)
│       ├── repository/           ← JPA Repositories
│       ├── entity/               ← JPA Entities (User, Product, ScanHistory)
│       ├── dto/request/          ← Input DTOs (validation)
│       ├── dto/response/         ← Output DTOs (Records)
│       ├── external/gemini/      ← GeminiClient
│       ├── external/off/         ← OpenFoodFactsClient
│       ├── security/             ← JwtAuthFilter, JwtUtil, UserIdRequestWrapper
│       ├── exception/            ← GlobalExceptionHandler
│       ├── enums/                ← ProductCategory, SubscriptionTier, ...
│       └── config/               ← AppConfig, RestClientConfig
│
└── dico-scan-mobile/             ← Frontend React Native (Expo)
    └── src/
        ├── screens/              ← Màn hình app
        ├── components/           ← UI components
        ├── services/             ← API calls
        └── navigation/           ← React Navigation
```

---

## 2. Quy trình Planning bắt buộc (TRƯỚC KHI CODE)

### Bước 1 — Đọc Context
```
1. Đọc doc/memory.md                    → nắm context tổng thể
2. Đọc doc/09_TECHNICAL_GUARDRAILS_V2.md → nắm rules không được vi phạm
3. Đọc doc/05_DATA_DICTIONARY_ERD_V2.md → xem schema DB hiện tại
4. Đọc doc/06_API_SPECIFICATION_V2.yaml → xem API hiện tại
```

### Bước 2 — Scan Code Liên quan
```
Trước khi implement, PHẢI đọc code hiện tại của layer liên quan:
- Entity: entity/User.java hoặc entity/Product.java
- Repository: repository/UserRepository.java
- Service: service/ProductApplicationService.java (orchestrator)
- Controller tương tự: controller/SafetyProfileController.java
```

### Bước 3 — Xác định Scope
Trả lời 5 câu hỏi:

| Câu hỏi | Ví dụ |
|---------|-------|
| Tính năng mới cần thêm cột DB không? | → Tạo Flyway migration `V{n+1}` |
| Có thêm endpoint mới không? | → Tạo Controller + DTO mới |
| Cần Tier gating (FREE/PREMIUM)? | → Check `user.getSubscriptionTier()` |
| Cần AI? | → Xem `04_AI_INTEGRATION_CONTRACT_V2.md` |
| Cần gọi OFF API? | → Xem `07_EXTERNAL_INTEGRATION_OFF_V2.md` |

---

## 3. Checklist Triển khai (Execution)

### ✅ DB Layer
```
[ ] Tạo Flyway migration: V{n+1}__feature_name.sql
    - Chỉ dùng ADD COLUMN IF NOT EXISTS (safe migration)
    - Thêm GIN index nếu thêm JSONB column
    - Không DROP hoặc RENAME column (breaking change)
```

### ✅ Entity Layer
```
[ ] Thêm field mới vào Entity (User/Product/ScanHistory)
    - JSONB → @JdbcTypeCode(SqlTypes.JSON)
    - Enum → @Enumerated(EnumType.STRING)
    - Không dùng @OneToMany, @ManyToOne (Guardrail Rule 2)
```

### ✅ Repository Layer
```
[ ] Chỉ thêm @Query nếu thực sự cần custom query
    - Dùng DTO Projection thay vì trả full Entity (Guardrail Rule 1)
    - KHÔNG dùng @Modifying + JPQL cho JSONB columns → dùng entity load/save
```

### ✅ Service Layer
```
[ ] Tạo Service class mới hoặc thêm method vào service hiện có
    - Nếu gọi network (OFF/Gemini): KHÔNG đặt trong @Transactional method
    - Business logic thuần → đặt trong @Transactional @Service
    - Tách persist logic ra ProductPersistService-style nếu có transaction+network
    - Tier check: if (user.getSubscriptionTier() != PREMIUM) throw PremiumRequiredException
```

### ✅ Controller Layer
```
[ ] Tạo Controller mới hoặc thêm endpoint
    - Request body: tạo record DTO trong dto/request/ với @Valid annotations
    - Response: tạo record DTO trong dto/response/ với @JsonInclude(NON_NULL)
    - Auth: @RequestHeader(value = "X-User-Id", required = false) UUID userId
    - Swagger: @Tag, @Operation annotations
    - Validate barcode: @Pattern(regexp = "^[0-9]{8,14}$")
```

### ✅ Security Layer
```
[ ] Nếu endpoint CẦN đăng nhập → thêm vào isProtectedEndpoint() trong JwtAuthFilter
[ ] Nếu endpoint PUBLIC (anonymous OK) → KHÔNG làm gì thêm
```

### ✅ Exception Handling
```
[ ] Dùng GlobalExceptionHandler đã có cho common errors
[ ] Nếu cần exception mới: tạo class extends RuntimeException, thêm @ExceptionHandler
[ ] KHÔNG throw Exception trực tiếp từ Controller
```

### ✅ Documentation
```
[ ] Cập nhật doc/06_API_SPECIFICATION_V2.yaml — thêm endpoint mới
[ ] Cập nhật doc/05_DATA_DICTIONARY_ERD_V2.md — nếu có DB change
[ ] Cập nhật doc/08_IMPLEMENTATION_ROADMAP_V2.md — đánh dấu task
[ ] Cập nhật doc/memory.md — nếu có thay đổi lớn
```

### ✅ Test & Verify
```
[ ] ./mvnw clean compile -q         → PHẢI pass 0 errors
[ ] Restart app → kiểm tra Flyway migration apply thành công
[ ] Test endpoint bằng curl hoặc Swagger UI (localhost:8080/swagger-ui.html)
```

---

## 4. Patterns Chuẩn (Copy & Adapt)

### Pattern 1: Thêm endpoint PREMIUM-only
```java
// Controller
@PutMapping("/v1/users/me/new-feature")
public ResponseEntity<?> updateFeature(
        @RequestHeader(value = "X-User-Id", required = false) UUID userId,
        @RequestBody @Valid NewFeatureRequest request) {
    if (userId == null) return ResponseEntity.status(401).build();
    return ResponseEntity.ok(featureService.update(userId, request));
}

// Service
public void update(UUID userId, NewFeatureRequest request) {
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));
    if (user.getSubscriptionTier() != SubscriptionTier.PREMIUM) {
        throw new PremiumRequiredException("Tính năng này yêu cầu gói PREMIUM");
    }
    // business logic...
    userRepository.save(user);
}
```

### Pattern 2: Thêm cột JSONB vào User
```sql
-- V6__add_new_feature.sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS new_feature_data jsonb DEFAULT '{}';
```
```java
// User.java
@JdbcTypeCode(SqlTypes.JSON)
@Column(name = "new_feature_data", columnDefinition = "jsonb")
private Map<String, Object> newFeatureData = new HashMap<>();
```

### Pattern 3: Thêm loại Exception mới
```java
// exception/FeatureNotFoundException.java
public class FeatureNotFoundException extends RuntimeException {
    public FeatureNotFoundException(String message) { super(message); }
}

// GlobalExceptionHandler.java — thêm handler
@ExceptionHandler(FeatureNotFoundException.class)
public ResponseEntity<StandardError> handleFeatureNotFound(
        FeatureNotFoundException ex, HttpServletRequest req) {
    return ResponseEntity.status(404)
            .body(new StandardError("FEATURE_NOT_FOUND", ex.getMessage(), requestId(req)));
}
```

### Pattern 4: Thêm scoring logic mới
```
// ScoringEngineService.java là pure Java, zero I/O
// Chỉ thêm method private, gọi từ calculate()
// KHÔNG inject Repository, KHÔNG gọi network
```

---

## 5. Technical Guardrails — KHÔNG được vi phạm

> Từ `09_TECHNICAL_GUARDRAILS_V2.md`

| Rule | Mô tả | Hậu quả vi phạm |
|------|--------|-----------------|
| **Rule 1** | NO N+1 Query — không lazy load trong loop | Timeout, connection pool exhausted |
| **Rule 2** | Unidirectional only — không @ManyToOne, @OneToMany | Memory leak, LazyInitException |
| **Rule 3** | Tách @Transactional khỏi network call | DB connection held quá lâu |
| **Rule 4** | AI chỉ sinh text — không quyết định màu/điểm | Business logic sai |
| **Rule 5** | Tier gate PREMIUM features | FREE users access premium data |
| **Rule 6** | JSONB update: dùng entity load/save — không @Modifying JPQL | Hibernate type mapping error |

---

## 6. Key Files tham khảo nhanh

| Cần làm gì | Đọc file này |
|-----------|-------------|
| Hiểu auth flow | `security/JwtAuthFilter.java`, `17_AUTH_SPEC.md` |
| Thêm endpoint | `controller/SafetyProfileController.java` (template tốt nhất) |
| Thêm scoring logic | `service/scoring/ScoringEngineService.java` |
| Thêm AI prompt | `external/gemini/GeminiClient.java` |
| Hiểu tier gating | `service/ProductApplicationService.java` lines 67-101 |
| Thêm exception | `exception/GlobalExceptionHandler.java` |
| DB migration | `resources/db/migration/V3__add_safety_profile.sql` (template) |
| Seed data | `resources/db/migration/V5__seed_test_users.sql` |

---

## 7. Test Accounts (Dev/Staging)

| Account | Email | Password | Tier | UUID |
|---------|-------|----------|------|------|
| Premium | `premium@dico.test` | `Test@1234` | PREMIUM | `11111111-*` |
| Free | `free@dico.test` | `Test@1234` | FREE | `22222222-*` |

**Login flow:**
```bash
# Lấy JWT token
POST http://localhost:8080/v1/auth/login
{"email": "premium@dico.test", "password": "Test@1234"}

# Dùng token
GET http://localhost:8080/v1/products/8934567890123
Authorization: Bearer <token>
```

---

## 8. Ví dụ: Planning & Implement tính năng mới

> **Yêu cầu giả định:** "Thêm tính năng Scan History — user xem lại lịch sử quét 30 ngày gần nhất"

### Planning
```
1. Đọc: ScanHistory entity đã có (entity/ScanHistory.java)
2. Đọc: ScanHistoryRepository đã có (tìm method findByUserId)
3. Scope:
   - DB: KHÔNG cần migration mới (bảng scan_history đã có từ V1)
   - Endpoint mới: GET /v1/users/me/scan-history
   - DTO mới: ScanHistoryItemResponse (đã có)
   - Auth: Cần userId → endpoint protected
4. Guardrail check:
   - Rule 1: Dùng @Query với LIMIT thay vì findAll() → tránh N+1
   - Rule 2: ScanHistory.userId là UUID raw (không phải @ManyToOne) ✓
```

### Implementation
```
1. ScanHistoryRepository: thêm findTop30ByUserIdOrderByScannedAtDesc()
2. ScanHistoryService: tạo mới với method getHistory(UUID userId)
3. ScanHistoryController: GET /v1/users/me/scan-history
4. JwtAuthFilter.isProtectedEndpoint(): thêm path
5. Cập nhật doc/06_API_SPECIFICATION_V2.yaml
6. ./mvnw clean compile -q → verify
```
