# Technical Guardrails (Quy chuẩn Mã nguồn cho AI Agent & Lập trình viên V2)

Tài liệu này không đàm phán (Non-negotiable). Đây là bộ rào cản kỹ thuật được thiết kế đặc biệt để kìm cương các AI Coding Agents và các Lập trình viên khi triển khai dự án **DICO Scan**. Mục đích: Tránh các lỗi kinh điển về hiệu năng (N+1 Query, Memory Leaks, Lỗi kết nối).

---

## 1. Phòng chống N+1 Query (Spring Boot / Data JPA)

### Quy tắc Số 1: CẤM sử dụng Vòng lặp để Fetch Relations (No loop lazy loading)
- **Anti-pattern (❌ SAI):**
  ```java
  List<Product> products = productRepo.findAll();
  for(Product p : products) {
      System.out.println(p.getAdditives().size()); // Gây ra N queries
  }
  ```
- **Cách làm (✅ ĐÚNG):** 
  Phải định nghĩa sẵn Custom Method trong Repository bằng `@EntityGraph` hoặc cấp một chuỗi JPQL dùng `JOIN FETCH`:
  ```java
  @Query("SELECT p FROM Product p LEFT JOIN FETCH p.additives WHERE p.ratingColor = :color")
  List<Product> findProductsWithAdditives(String color);
  ```

### Quy tắc Số 2: Cấm Bidirectional Mappings nảy sinh
- Chỉ thiết lập Relationship từ phía **Many** trỏ về **One** (`@ManyToOne`).
- **KHÔNG KHAI BÁO** list (`@OneToMany`) bên trong Parent nếu Collection (số lượng con) có nguy cơ vượt qua 100 dòng. (Ví dụ: `User` entity không được chứa danh sách `List<ScanHistory>`, vì 1 ông dùng app 3 năm sẽ kéo DB treo lun). Cần query Lịch sử bằng HistoryRepository: `scanHistRepo.findByUserId(userId)`.

### Quy tắc Số 3: Bắt buộc dùng DTO Projections cho API READ
- Tất cả API GET (Ví dụ: Get Scan History) trả về một List. Agent **bắt buộc** query trực tiếp vào DTO interface hoặc class Record, bỏ qua cơ chế Lifecycle Entity của Hibernate để chạy thuần túy 1 lệnh SQL nhanh nhất mức có thể.

---

## 2. Phòng chống Memory Leak & OutOfMemory (OOM)

### Quy tắc Số 4: Streaming thao tác Data lớn
Nếu cần xử lý lô (Ví dụ export CSV, hay cập nhật lại toàn bộ db):
- Tuyệt đối không gọi `findAll()` đưa toàn bộ RAM. Bắt buộc dùng `@Query` với `Stream<T>` kết hợp `@Transactional(readOnly = true)`.

### Quy tắc Số 5: Xóa Cache đúng lúc
Mặc dù hệ thống dùng Caffeine Cache ở RAM cục bộ:
- Cấm lưu trữ những object sinh động (mutating objects). Chỉ cache các record Immutable (như Điểm của 1 loại thực phẩm).
- Thiết lập Time-To-Live (TTL = 1 hour) hoặc Size Lru bound `maximumSize = 1000`.

---

## 3. Kiến trúc Đa luồng (Thread & Async rules)

### Quy tắc Số 6: Cách ly API Network chậm
Khi tương tác OpenFoodFacts API hoặc Gemini 1.5 API (Timeout = 2 giây):
- **Tuyệt đối không** được block Thread xử lý của DB (`@Transactional` connection pooling).
- Cụ thể: Bắt buộc phải **bỏ annotation `@Transactional` ở hàm ngoài cùng** của các lớp gọi mạng nặc danh, hoặc nhốt Data call vào phương thức Private riêng, đóng giao dịch DB, trước khi đi qua Network. Nếu không => Lập tức sập cạn kết nối CSDL (Connection Pool exhaustion) của Cloud SQL. 

---

## 4. Kiểm thử tự động bắt lỗi N+1
Yêu cầu Agent / QA Engineer khi viết Integration Test:
- Tích hợp config đo lượng Query trong unit test `spring.jpa.properties.hibernate.generate_statistics=true` hoặc thư viện `yannbriancon:spring-hibernate-query-utils`.
- Hàm Asert unit test phải kiểm tra số lượng statements chạy:
  `assertSelectCount(1);` (Chỉ cho phép chạy duy nhất 1 câu Query GET cho endpoint đó). Nếu test fail -> Code sai rule, Agent tự viết lại.

---

**[Lưu ý cho AI Agent Mới Nhận Dự Án]:** Khi bạn phân tích và tạo Entity/Repository, hãy quay lại và đọc thật kỹ **Quy tắc 1 và 2** trước khi sinh code. Dùng DTO-First approach là lựa chọn an toàn.
