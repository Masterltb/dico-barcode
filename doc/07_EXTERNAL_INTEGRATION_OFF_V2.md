# Chính sách Tích hợp OpenFoodFacts V2

Tài liệu này chuẩn hóa và đưa ra các quy ước kỹ thuật bắt buộc khi kết nối backend DICO Scan với OpenFoodFacts (OFF). Bất kể server OFF có chập chờn hay chậm chạp, API Backend của chúng ta vẫn phải đảm bảo hoạt động an toàn trước Mobile App (không bao giờ sập dây chuyền).

## 1. REST Client (Resilience Configuration)
Backend (Spring Boot) sẽ gọi Data từ endpoint: `GET https://world.openfoodfacts.org/api/v2/product/{barcode}.json` thông qua `RestTemplate` hoặc `WebClient`.

**Cấu hình bắt buộc (Bảo vệ API của chúng ta):**
- **Connection Timeout:** Giao tiếp TCP kết nối: `1000ms`.
- **Read Timeout:** Quá trình tải dữ liệu body từ OFF: Tối đa `3000ms` là hủy bỏ luồng cắt đứt để bảo vệ Thread Pool.
- **Retry Policy:**
  - Max Attempts: `2`.
  - Delay: `500 ms` (Fixed Backoff).
  - Điều kiện Retry: Chỉ retry nếu dính các lỗi hệ thống của OFF `5xx (500, 502, 503, 504)` hoặc `ReadTimeout`. KHÔNG bao giờ bị lừa retry lỗi `4xx` (Vd 404 là product ko có, phải accept luôn).
- **Circuit Breaker state:**
  - Nếu gặp lỗi Timeout liên tiếp >= 50% trong 10 requests qua API OFF => Mở ngắt mạch (Open). Mọi request sau đó trong vòng 30s tới OFF sẽ bị failfast mà không cần tốn thời gian gọi OFF, giảm tải.

## 2. Payload Extraction (Chống Null/Missing Data)
Dữ liệu của OFF thường là do cộng đồng đóng góp -> Cực kỳ "rác" (bẩn) và không nhất quán. Thuật toán Parser phải áp dụng null safety 100%.

Yêu cầu lấy các trường:
- `product_name`
- `brands`
- `image_url`
- `ingredients_text`: Đây là dữ liệu gốc AI sẽ đọc. NẾU NULL -> Phải handle để chấm Confidence Score < 1.0 bên Deterministic.
- `nutriments`: Lấy đối tượng map lồng JSON này để kéo giá trị:
  - `energy-kcal_100g` -> Bắt fallback double = 0.
  - `sugars_100g` -> Bắt fallback double = 0.
  - `salt_100g` -> Bắt fallback double = 0.
- `nutriscore_grade`: Chuỗi chữ thường 'a', 'b', 'c', 'd', 'e'. Bắt buộc Uppercase('A', 'B' ...) tránh lỗi enum Java.
- `nova_group`: Số Integer (1,2,3,4).
- `additives_tags`: Array of strings (Khá đáng tin cậy vì OFF auto map e-numbers).
- `allergens_hierarchy`: Dùng để check O2 (Allergy rules). Nếu empty/null -> Chuyển match string nguyên mảng `ingredients_text` qua Index.

## 3. Quản trị Rate Limits và Đạo đức (Ethics & Crawl Prevent)
OFF là cộng đồng phi lợi nhuận mã nguồn mở, không được DDOS hoặc Crawl bừa bãi.
- Tất cả các HTTP Request của Backend DICO Scan đều BẮT BUỘC gắn HEADER User-Agent tuân thủ chuẩn:
  ```http
  User-Agent: DicoScan - iOS/Android - Version 1.0 - www.dico-scan.com
  ```
- **Caching tại DB:** Như Architecture V2, Backend chỉ fetch 1 lần từ OFF duy nhất khi DB trống Barcode này. Toàn bộ người quét thứ 2, thứ 3 sẽ được đọc Cache từ CSDL PostgreSQL (Trường JSONB `off_payload`). Cache được tái cấu trúc dọn dẹp mỗi 3 tháng. Không gọi OFF cho request cache-hit.
