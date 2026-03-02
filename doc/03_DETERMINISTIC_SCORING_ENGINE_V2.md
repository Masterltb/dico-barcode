# Scoring Engine Deterministic V2

Tài liệu này định nghĩa Bộ máy Chấm điểm bằng thuật toán (Deterministic Scoring Engine). Bộ máy này mang tính **quyết định cuối cùng** về màu sắc an toàn (Xanh, Vàng, Đỏ) của sản phẩm. LLM/AI không được can thiệp vào kết quả của engine này.

---

## 1. Công thức Toán học Tổng quát (Score: 0 - 100)

Điểm số tối đa của một sản phẩm là `100`. Điểm được tổng hợp từ 3 trọng số (Pillars):
**`Final_Score = (N_Nutri * 0.4) + (N_Nova * 0.4) + (N_Additives * 0.2)`**

### 1.1. Bảng quy đổi N_Nutri (Trọng số 40%)
Dựa trên giá trị `nutriscore_grade` chuẩn châu Âu từ OpenFoodFacts API:
- **`A`** -> N_Nutri = `100` điểm.
- **`B`** -> N_Nutri = `80` điểm.
- **`C`** -> N_Nutri = `60` điểm.
- **`D`** -> N_Nutri = `40` điểm.
- **`E`** -> N_Nutri = `20` điểm.
- *Nếu API trả về `null`* -> N_Nutri = `50` (Điểm phạt mức trung bình).

### 1.2. Bảng quy đổi N_Nova (Trọng số 40%)
Dựa trên giá trị `nova_group` biểu thị mức độ xử lý/siêu chế biến:
- **`1`** (Unprocessed/Minimally processed) -> N_Nova = `100` điểm.
- **`2`** (Processed culinary ingredients) -> N_Nova = `80` điểm.
- **`3`** (Processed foods) -> N_Nova = `50` điểm.
- **`4`** (Ultra-processed foods) -> N_Nova = `10` điểm.
- *Nếu API trả về `null`* -> N_Nova = `50` điểm.

### 1.3. Bảng quy đổi N_Additives (Trọng số 20%)
Giá trị khởi điểm `N_Additives = 100`. Dựa trên danh sách mảng `additives_tags` (ví dụ `["en:e102", "en:e300"]`):
1. Quét danh sách các phụ gia.
2. Với mỗi chất phụ gia được đánh dấu là **Trung bình / Cảnh báo nhẹ (Medium Risk)**: Trừ `-15` điểm.
3. Với mỗi chất phụ gia được đánh dấu là **An toàn (Low Risk)**: Trừ `-0` điểm. (Vd: Vitamin C - E300).
4. Phụ gia rủi ro cao (High Risk / Banned) => Giải quyết ở khâu overrides (mục 3). 
*Lưu ý: N_Additives thấp nhất là `0` (không có giá trị âm).*

---

## 2. Ngưỡng phân bổ Nhãn Màu (Color Thresholds)
Từ `Final_Score`, hệ thống gán một Color Enumeration. Không làm tròn.
- **GREEN (Xanh):** `Score >= 70`
- **YELLOW (Vàng):** `40 <= Score < 70`
- **RED (Đỏ):** `Score < 40`

---

## 3. Quy tắc Ghi đè Cấp cao (Overrides System - Highest Priority)

Bất chấp điểm số thuật toán phía trên trọn vẹn 100 điểm, nếu vi phạm một trong các Ruleset sau, hệ thống **ép buộc** ghi đè kết quả:

### Override 1 (O1): Blacklisted / High-Risk Additives
- **Luật:** Nếu `additives_tags` chứa BẤT KỲ phụ gia nào thuộc danh mục "High Risk / Carcinogenic" (VD: Titanium Dioxide E171, Aspartame, Nitrites E250). Danh mục được duy trì tĩnh trên bộ nhớ Backend.
- **Action:** Gán cứng `rating = RED`. Cập nhật `Final_Score = Min(Final_Score, 39)`. Thêm lý do vào mảng rủi ro: `"Blacklisted additive detected: E171"`.

### Override 2 (O2): Allergy Conflict (Dị ứng)
- **Luật:** Backend so khớp mảng string `user.preferences.allergies` với văn bản thô `ingredients_text` và `allergens_hierarchy` từ OFF.
- **Action:** Nếu có match (Khớp chuỗi / Substring match). Gán cứng `rating = RED`. Cập nhật `Final_Score = Min(Final_Score, 10)` (Phạt rất nặng vì có khả năng gây sốc phản vệ). Thêm lý do: `"Allergy conflict: Peanut"`.

### Override 3 (O3): Missing Critical Data Fallback
- **Luật:** Nếu OpenFoodFacts API trả về: `nutriscore_grade = null` AND `nova_group = null` AND (`ingredients_text = null` OR `ingredients_text == ""`).
- **Action:** Gán cứng `rating = UNKNOWN`. Không chấm điểm (Score = `null`). Thêm lý do: `"Insufficient Product Data"`.
