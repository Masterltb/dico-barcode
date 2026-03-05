# DICO Scan - AI Agent Memory & Context Guide (V2 — Cập nhật)

> **[CRITICAL SYSTEM PROMPT INSTRUCTION]** 
> *Tài liệu này là bản nén toàn bộ dự án. Bám vào `memory.md` để nắm context trước khi code.*

---

## 1. Project Context & Constraints
*   **Project:** DICO Scan MVP. Quét barcode > Phân loại danh mục > Tính điểm (0-100) > Cấp màu (Xanh/Vàng/Đỏ) > AI Tóm tắt.
*   **Tech Stack:** Java 21, Spring Boot 3, PostgreSQL 16 (Cloud SQL), Cloud Run, Gemini 1.5 Flash.
*   **Subscription Tiers:** FREE (generic scan) / PREMIUM (personalization + safety profile).
*   **Product Categories:** FOOD / TOY / BEAUTY / FASHION / GENERAL.

*   **DB Tables:**
    *   `users` (id UUID, email, password_hash, display_name, subscription_tier, preferences JSONB, profile_data JSONB, safety_profile JSONB, profile_completed).
    *   `products` (barcode PK, name, brand, image_url, off_payload JSONB, determin_score, rating_color, confidence_score, ai_summary_cache, ai_inputs_hash, category).
    *   `scan_history` (id UUID, user_id FK, barcode FK, scanned_at, snapshot_color).

*   **[NON-NEGOTIABLE GUARDRAILS]:**
    1.  **NO N+1 Query:** Cấm loop lazy loading. Bắt buộc DTO Projection hoặc `@EntityGraph`.
    2.  **Transactions & Network:** Tuyệt đối không bọc `@Transactional` khi gọi OFF/Gemini → chống sập Connection Pool.
    3.  **Resilience:** Mọi REST Client phải có Retry + Timeout (AI 2s, OFF 3s).
    4.  **AI Usage:** Gemini CHỈ sinh text tóm tắt < 50 từ. KHÔNG cho điểm, KHÔNG quyết định màu.
    5.  **Tier Gating:** FREE users = generic scoring. PREMIUM users = personal allergies + safety profile.

---

## 2. API Endpoints (7 total)

| Method | Endpoint | Auth | Tier | Controller |
|--------|----------|------|------|-----------|
| POST | `/v1/auth/register` | Public | - | AuthController |
| POST | `/v1/auth/login` | Public | - | AuthController |
| GET | `/v1/products/{barcode}` | Optional X-User-Id | FREE/PREMIUM | ProductController |
| PUT | `/v1/users/me/preferences` | Required | PREMIUM | UserController |
| PUT | `/v1/users/me/safety-profile` | Required | PREMIUM | SafetyProfileController |
| GET | `/v1/users/me/safety-profile` | Required | - | SafetyProfileController |
| POST | `/v1/contribute` | Optional | - | ContributionController |

---

## 3. Core Workflow: /v1/products/{barcode}

Orchestrator (`ProductApplicationService`) 7 bước:
1.  **User + Tier:** Load user → xác định FREE/PREMIUM → extract allergies.
2.  **DB Cache:** Tìm barcode trong DB. Fresh (< 90 ngày) → trả ngay.
3.  **OFF Fetch:** Cache miss → gọi OpenFoodFacts. 404 → `ProductNotFoundException`.
4.  **Category Detection:** `ProductCategoryDetector` phân loại từ `categories_tags`.
5.  **Deterministic Scoring:** `Score = N_Nutri(40) + N_Nova(40) + N_Additive(20)`.
    *   Override O1: Blacklist additive → RED (score ≤ 39).
    *   Override O2: Allergy conflict → RED (score ≤ 10).
    *   Override O3: Missing data → UNKNOWN.
6.  **Persist:** `ProductPersistService.saveProduct()` (separate `@Transactional`).
7.  **AI Layer:** Hash check → AI cache hit hoặc gọi Gemini → timeout 2000ms → fallback.

---

## 4. Service Map

| Service | Responsibility |
|---------|---------------|
| `ProductApplicationService` | Orchestrator 7 bước |
| `ScoringEngineService` | Pure Java math scoring |
| `AdditiveRiskRegistry` | HIGH/MEDIUM/LOW additive classification |
| `ProductCategoryDetector` | FOOD/TOY/BEAUTY/FASHION/GENERAL detection |
| `ProductPersistService` | DB save với `@Transactional` |
| `GeminiClient` | AI call + category prompt templates |
| `OpenFoodFactsClient` | OFF API proxy + timeout |
| `SafetyProfileService` | Questionnaire CRUD + sanitization |
| `AuthService` | Register/Login + JWT + BCrypt |
| `UserService` | Preferences update |

---

## 5. Sprint Status
- **Sprint 1-3:** ✅ HOÀN THÀNH (DB, Entities, OFF, Scoring, AI, Auth, Tier, Safety Profile, Categories).
- **Sprint 4:** 🔲 CHƯA (Resilience4j, Bucket4j, Tests, CI/CD, GCP Deploy).

---

## 6. Troubleshooting
1.  **"N+1 Query"** → Đổi response về Java Record, gắn `@Query` bốc 1 SELECT.
2.  **"Connection Pool Exhausted"** → Tách `@Transactional` khỏi hàm gọi OFF/Gemini.
3.  **"JSON Parse Exception"** → Check System Prompt Gemini, thêm "RETURN ONLY RAW JSON".
4.  **"PremiumRequiredException"** → User là FREE, endpoint yêu cầu PREMIUM.
