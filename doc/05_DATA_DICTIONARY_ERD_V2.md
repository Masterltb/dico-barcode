# Lược đồ Dữ liệu và Constraints (PostgreSQL V2 — Cập nhật)

Tài liệu thiết kế cấu trúc CSDL mức vật lý phục vụ khả năng chịu tải cao và tìm kiếm linh hoạt cho DICO Scan. DB sử dụng PostgreSQL 16+.

## 1. Sơ đồ Thực thể (ERD)
```mermaid
erDiagram
    users ||--o{ scan_history : "thực hiện"
    products ||--o{ scan_history : "được quét"

    users {
        uuid id PK
        varchar_255 email "UNIQUE, NOT NULL"
        varchar_255 password_hash "BCrypt hash"
        varchar_100 display_name
        varchar_20 subscription_tier "FREE | PREMIUM, default FREE"
        jsonb preferences "allergies + diet"
        jsonb profile_data "Extended profile (Premium)"
        jsonb safety_profile "Questionnaire wizard data (Premium)"
        boolean profile_completed "default false"
        timestamptz created_at
        timestamptz updated_at
    }

    products {
        varchar_14 barcode PK "EAN-8 to EAN-14"
        varchar_255 name
        varchar_255 brand
        text image_url "Product image from OFF"
        jsonb off_payload "Cache data thô từ OFF API"
        int2 determin_score "0-100, NULL nếu UNKNOWN"
        varchar_10 rating_color "GREEN | YELLOW | RED | UNKNOWN"
        float confidence_score "0.0-1.0, default 1.0"
        text ai_summary_cache "Tóm tắt AI, NULL = chưa chạy"
        varchar_64 ai_inputs_hash "SHA-256 hash AI inputs"
        varchar_30 category "FOOD | TOY | BEAUTY | FASHION | GENERAL, default FOOD"
        timestamptz created_at
        timestamptz updated_at
    }

    scan_history {
        uuid id PK
        uuid user_id FK
        varchar_14 barcode FK
        timestamptz scanned_at
        varchar_10 snapshot_color "Lưu lại màu tại thời điểm quét"
    }
```

## 2. Table Schemas, Constraints & Indexes

### Bảng `users`
Bảng lưu trữ người dùng, xác thực, cấu hình cá nhân và hồ sơ an toàn.
- **Constraints**:
  - `email` phải duy nhất (Unique Constraint).
  - `subscription_tier` mặc định `FREE`, chỉ chấp nhận `FREE` hoặc `PREMIUM`.
  - `profile_completed` mặc định `false`.
  - Khóa chính UUID v4 sinh tự động.
- **Indexes**:
  - B-tree Index trên `email`.
  - **GIN Index trên trường `preferences`**: Hỗ trợ tìm kiếm siêu tốc trên JSON `user.preferences.allergies`.
  - `CREATE INDEX idx_users_prefs ON users USING GIN (preferences);`

### Bảng `products`
Bảng Product Catalog + Product Cache phân tích đa danh mục.
- **Constraints**:
  - `barcode`: Khóa chính (Primary Key), tối đa 14 ký tự.
  - `rating_color`: `CHECK (rating_color IN ('GREEN', 'YELLOW', 'RED', 'UNKNOWN'))`.
  - `determin_score`: `CHECK (determin_score >= 0 AND determin_score <= 100)`.
  - `confidence_score`: mặc định `1.0`, range `[0.0, 1.0]`.
  - `category`: mặc định `'FOOD'`.
- **Indexes**:
  - B-tree Index trên `updated_at DESC`: Phục vụ cache eviction (sản phẩm > 3 tháng).
  - B-tree Index trên `ai_inputs_hash`: AI caching resolver.
  - GIN Index (tùy chọn Phase 2) trên `off_payload`: Full-text search.

### Bảng `scan_history`
Lưu trữ log quét của người dùng với snapshot pattern.
- **Thiết kế mở rộng**:
  - Table Partitioning theo thời gian (Range Partitioning by Month trên `scanned_at`).
  - Khi xóa logs > 6 tháng, chỉ cần `DROP PARTITION`.
- **Constraints**:
  - `user_id` FK tới `users.id`. `barcode` FK tới `products.barcode`.
  - ON DELETE CASCADE user, giữ nguyên product.
- **Indexes**:
  - Composite Index: `CREATE INDEX idx_scan_hist_user_time ON scan_history(user_id, scanned_at DESC);`

## 3. Flyway Migration History
| Version | File | Nội dung |
|---------|------|---------|
| V1 | `V1__init_schema.sql` | 3 bảng core: `users`, `products`, `scan_history` |
| V2 | `V2__add_subscription_and_category.sql` | Thêm `subscription_tier`, `category`, `image_url`, `confidence_score` |
| V3 | `V3__add_safety_profile.sql` | Thêm `profile_data`, `safety_profile`, `profile_completed` |
| V4 | `V4__add_password_hash.sql` | Thêm `password_hash` |

## 4. Data Retention Lifecycle
- **products**: TTL 3 tháng. Background cron: `DELETE FROM products WHERE updated_at < NOW() - INTERVAL '3 months'`.
- **scan_history**: Lịch sử lưu 6 tháng. Truncate partition tự động hàng tháng.
