# DICO Scan - Chuyên Gia Dinh Dưỡng Bỏ Túi

DICO Scan là ứng dụng quét mã vạch sản phẩm thông minh, kết hợp với AI (Gemini) để phân tích thành phần, cảnh báo chất gây dị ứng và đánh giá mức độ an toàn của thực phẩm.

Repository này là một **Monorepo** chứa toàn bộ mã nguồn của dự án bao gồm:
- Mảng Backend (`/dico-scan`): Java Spring Boot, PostgreSQL, tích hợp OpenFoodFacts API & Gemini API.
- Mảng Frontend (`/dico-scan-mobile`): React Native (Expo Managed Workflow) cho iOS & Android.
- Mảng Tài liệu (`/doc`): Specs, Architecture, Flowcharts và Roadmap.

---

## 🛠 Yêu cầu hệ thống (Prerequisites)

Trước khi chạy dự án, hãy đảm bảo máy bạn đã cài đặt:
1. **Java 21** (Dành cho Backend)
2. **Node.js 18+** & **npm** (Dành cho Frontend)
3. **PostgreSQL 16+** (Cơ sở dữ liệu)
4. Ứng dụng **Expo Go** cài trên điện thoại thật (iOS/Android) để test Mobile App.

---

## 🚀 Hướng dẫn khởi chạy Backend (Java Spring Boot)

**Bước 1: Khởi tạo Database**
Mở PostgreSQL (PgAdmin hoặc PSQL terminal) và tạo database trống:
```sql
CREATE DATABASE dicoscan;
```
*(Lưu ý: Flyway Migration đã được cấu hình trong source code, nó sẽ tự động tạo các bảng ngay khi bạn chạy app lần đầu)*

**Bước 2: Cấu hình bí mật (.env)**
Mở thư mục `dico-scan`, sao chép file `.env.example` thành `.env`:
```powershell
cp .env.example .env
```
Sau đó mở file `.env` và điền các thông tin của bạn vào:
- `DB_PASS`: Mật khẩu PostgreSQL.
- `GEMINI_API_KEY`: Mã API Key tải từ Google AI Studio.
*(Lưu ý: File `.env` đã được cấu hình trong `.gitignore` để không bị lộ lên GitHub)*

**Bước 3: Chạy ứng dụng**
Mở terminal tại thư mục Backend và chạy lệnh:
```powershell
cd dico-scan
./mvnw clean spring-boot:run
```
> Khi Terminal xuất hiện dòng `Started DicoScanApplication in x seconds`, Backend đã chạy thành công ở địa chỉ `http://localhost:8080`.

---

## 📱 Hướng dẫn khởi chạy Frontend (React Native / Expo)

**Bước 1: Lấy địa chỉ IP mạng nội bộ**
Vì điện thoại thực tế không nhận `localhost` bằng máy chủ trên vi tính, bạn cần lấy địa chỉ IP của IPv4 của máy bạn:
- Mở PowerShell gõ lệnh `ipconfig`.
- Tìm dòng `IPv4 Address` (Ví dụ: `192.168.1.28`).

**Bước 2: Sửa cấu hình API**
Vào thư mục `dico-scan-mobile`, tạo một hoặc sao chép file `.env.example` thành `.env`, sau đó cập nhật địa chỉ IP của bạn vào:
```env
EXPO_PUBLIC_API_URL=http://<IP_CUA_BAN>:8080
EXPO_PUBLIC_API_TIMEOUT_MS=5000
```
*(Ví dụ chuẩn: `EXPO_PUBLIC_API_URL=http://192.168.1.28:8080`)*

**Bước 3: Cài thư viện và chạy ứng dụng**
Mở terminal tại thư mục Frontend:
```powershell
cd dico-scan-mobile
npm install
npx expo start --clear
```

**Bước 4: Trải nghiệm UI**
1. **Trên điện thoại:** Mở app **Expo Go** -> Mở Camera quét mã QR hiển thị trên màn hình Terminal máy tính. 
2. **Trên Web browser:** (Nếu muốn test luồng nhanh trên vi tính) Nhấn phím `w` trong Terminal, app sẽ mở một tab trình duyệt chạy giao diện điện thoại.

---

## 📖 Tham khảo thêm
Hãy đọc các tài liệu bên trong thư mục `doc/` để hiểu toàn bộ quy trình kiến trúc, quy cách API, Database Schema, cũng như bản nháp các Roadmap trong tương lai.
