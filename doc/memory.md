# DICO Scan - AI Agent Memory & Context Guide (V2)

> **[CRITICAL SYSTEM PROMPT INSTRUCTION]** 
> *Tài liệu này là bản nén (compressed context) của toàn bộ dự án gốc. Thay vì bắt AI nhồi nhét 10 files tài liệu dài dòng gây lãng phí Token, hãy chỉ bám vào `memory.md` này để nắm toàn bộ ngữ cảnh trước khi code. Nếu cần detail phần nào mới gọi tool search file đó.*

---

## 1. Project Context & Constraints
*   **Project Context:** DICO Scan MVP (Web/Mobile App). Phân tích mã vạch thực phẩm > Tính điểm (0-100) > Cấp màu (Xanh/Vàng/Đỏ) > Sinh Tóm tắt (AI).
*   **Tech Stack:** Java 21, Spring Boot 3, Cloud SQL (PostgreSQL 16), Cloud Run, Gemini 1.5 Flash.
*   **DB Rules:** 
    *   Bảng `users` (id UUID, email, preferences JSONB).
    *   Bảng `products` (barcode PK, raw_payload JSONB, determin_score, rating_color, ai_summary_cache).
    *   Bảng `scan_history` (Partitioning theo ngày).

*   **[NON-NEGOTIABLE GUARDRAILS]:**
    1.  **NO N+1 Query:** Cấm dùng Vòng lặp lấy relations. Bắt buộc `#DTO Projection` (Record) hoặc `@EntityGraph`.
    2.  **Transactions & Network:** Tuyệt đối không bọc `@Transactional` ngoại vi khi gọi API chậm (OpenFoodFacts / Gemini) để chống sập Connection Pool.
    3.  **Resilience:** Mọi Rest Client gọi ra ngoài phải có `Retry` (Fall config) và `Timeout` (Max 2s cho AI, 3s cho Data).
    4.  **AI Usage:** Gemini AI CHỈ sinh text tóm tắt (< 50 từ). KHÔNG cho điểm, KHÔNG quyết định sinh màu Xanh/ Đỏ. Màu do Toán quyết định.

---

## 2. API & Data Flow (The Blueprint)

### Core Workflow: /v1/products/{barcode} (The Entry Point)
Khi có Request quét mã vạch xảy ra, quy trình 5 bước trong Orchestrator:
1.  **DB Check:** Tìm barcode trong DB. Nếu có & cache còn sống (< 3 tháng) => Mở bước 5.
2.  **Fetch (Network):** Quét OpenFoodFacts. Nếu không có => Ném lỗi `404 ProductNotFound`. Mobile tự gọi /contribute upload ảnh.
3.  **Deterministic Engine:** Vận hành Pure Math Java.
    *   `Score = N_Nutri (40) + N_Nova (40) + N_Additive (20)`. (Null Data = 50 điểm phạt).
    *   `GREEN (>70)`, `YELLOW (40-69)`, `RED (<40)`.
    *   *Hard Override O1/O2:* Ném vào List `Allergies` của User. Nếu khớp nguyên liệu => Ép ĐỎ `<10 điểm`.
4.  **AI Engine (Network Focus):**
    *   Input: `ingredients_text`, `salt`, `sugar`, `user_allergies`. Hash chuỗi này.
    *   Check Hash DB, có thì bốc luôn (AI Cache). Không có mới gõ lệnh cựu Gọi Gemini. Timeout 2000ms => Fallback AI Summary = rỗng.
5.  **Save & Response:** Update Record `products` => Push DTO `ProductEvaluationResponse` cho Mobile.

---

## 3. The Implementation Roadmap (Tick-box List cho Agent)

Trong quá trình generate code, bạn **bắt buộc phải chia Tasks / Tool Calls** theo đúng Roadmap sau. Không nhảy cóc.

*   **Sprint 1:** Build DB (Flyway), Xây Entity 1 chiều (Unidirectional), Viết Component `OffClient` gọi OpenFoodFacts (Resilience4j).
*   **Sprint 2:** Build API Core. Viết Service Toán Học (Deterministic) chấm điểm, xử Overrides dị ứng. Dọn dẹp Exception Catcher mượt mà.
*   **Sprint 3:** Cài API AI Gemini (Prompt: Trả Strictly JSON, Tóm tắt ngắn). Gắn vào luồng API chính với Timeout chuẩn. Viết API upload ảnh.

---

## 4. Troubleshooting (Khi Agent Bị Kẹt)
1.  **"Hibernate N+1 Query Error" ->** Dừng code, đổi hết Response của Endpoint GET về Java `Record` view trực tiếp, gắn `@Query` bốc đúng 1 lệnh SELECT.
2.  **"Connection Timeout / Cloud SQL Exhausted" ->** Tách cái hàm `productService.getAI(...)` vút xuống cuối, kéo `@Transactional(REQUIRES_NEW)` chỉ bao block lưu DB, nhả block gọi Mạng.
3.  **"JSON Parse Exception / LLM Yapping" ->** Check lại System Prompt của Gemini, bổ sung câu thần chú "DO NOT WRAP IN ```json. RETURN ONLY RAW JSON."

*Hãy nhớ Context này, giữ Response luôn gọn gàng và bám sát kiến trúc Serverless Micro-App.*
