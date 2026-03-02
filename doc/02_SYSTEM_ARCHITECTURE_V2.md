# Kiến trúc Hệ thống V2

Tài liệu này xác định kiến trúc hệ thống tổng thể của DICO Scan cho giai đoạn MVP, quy định rõ cách thức các luồng dữ liệu tương tác để tối ưu chi phí và duy trì sự ổn định.

## 1. Tổng quan Kiến trúc High-level

Kiến trúc dựa trên nguyên tắc Micro-services theo mô hình Cloud-Native, tận dụng tối đa Serverless để giảm Cost (Zero-cost khi không có request).

```mermaid
graph TD
    User((User (Mobile App))) <-->|HTTPS / REST API /v1| LB(Cloud Load Balancing)
    LB --> API[Spring Boot API App \n Cloud Run]
    
    subgraph DICO Backend (GCP Cloud Run)
        API --> DB[(PostgreSQL 16 \n Cloud SQL f1-micro)]
        API --> MemoryCache[[Caffeine Local Cache]]
    end
    
    API <-->|HTTP REST / 3s Timeout| OFF[OpenFoodFacts API]
    API <-->|RPC / Flash 1.5 / 2s Timeout| LLM[Gemini API]
    
    User <-->|Upload Image| CloudStorage[GCP Cloud Storage]
    API -.->|Async Queue| OCRWorker[Background OCR Worker - Phase 2]
```

## 2. Các Thành phần (Components & Responsibility)
1. **Frontend (React Native)**
   - Không được chứa logic quy đổi điểm (Xanh/Vàng/Đỏ). Thiết bị Mobile chỉ làm Presentation Layer dán nhãn (`Enum: GREEN, YELLOW, RED`).
   - Xử lý cache local ảnh ở thiết bị để tránh gọi lại storage API dư thừa.
2. **Gateway/API Layer (Spring Boot / Cloud Run)**
   - Authentication (Token validation Header `Authorization: Bearer <Token>`).
   - Validation dữ liệu (Request Schema Regex).
   - Rate limiting trên từng User ID / IP bằng `Bucket4j` framework.
3. **Service Layer**
   - **ProductFetchService:** Xử lý proxy xuống API OpenFoodFacts. Cài đặt Resilience4j `CircuitBreaker` (Nếu OFF sập -> Fallback return "SYSTEM_UNAVAILABLE").
   - **ScoringEngineService:** Chứa logic pure-math tính toán `score` và `color`. Pure Java, zero I/O dependency, Test coverage bắt buộc 100%.
   - **AIAnalysisService:** Gói parameters và gọi Gemini API để lấy JSON summary.
4. **Data Layer (PostgreSQL Cloud SQL)**
   - Lưu trữ cấu trúc Relational + Cấu trúc Semi-structured (JSONB) cho thành phần linh hoạt (`product_data_payload`).

## 3. Luồng Quản lý Dữ liệu Đóng góp (Crowdsourced Data Flow)
Sản phẩm lỗi `404 Not Found` sẽ kích hoạt luồng Unstructured Contribution.
**Logic xử lý (Kịch bản rẽ nhánh MVP):**
- Ngay khi nhận được error `404` => Mobile tự động điều hướng sang màn hình "Manual Input / Chụp Ảnh".
- Người dùng đẩy ảnh nhãn dán thông qua API `POST /v1/contribute (Content-Type: multipart/form-data)`.
- Backend sinh ra UUID cho ảnh, upload thẳng vào `GCS Bucket (Standard-Tier)`.
- Backend ghi một bản recod `Contributions(id, user_id, barcode, gcs_path, status='PENDING')` vào CSDL và trả status 202 ACCEPTED cho user (Không block request xử lý OCR online).

## 4. Chiến lược Resilience (Phục hồi Lỗi)
Mọi API External Call bắt buộc phải có Retry và Circuit Break.
1. Khống chế Retry cho OpenFoodFacts: Tối đa `2` lượt (Max attempts = 2), Fixed Backoff = `500ms`.
2. Khống chế Timeout cho Gemini/AI: Hard timeout ở tầng HttpClient = `2000ms`. Không Retry. Kích hoạt Fallback Function (`Return Default Product State without AI Summary`).
