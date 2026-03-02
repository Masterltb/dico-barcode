# AI Integration Contract V2 (LLM Specs)

Tài liệu này xác định giao kèo bắt buộc bằng mã tĩnh cho việc tích hợp AI (Gemini 1.5 Flash). Mục đích là khóa chặt rủi ro lỗi định dạng JSON (JSON parsing error) và chống hiện tượng AI tự cấu trúc lại màu sắc đánh giá của hệ thống Scoring Determinist.

## 1. Responsibility Boundary (Ranh giới Kỹ thuật)
AI **ĐƯỢC PHÉP**:
1. Đọc danh sách thành phần (ingredients_text).
2. Tóm tắt các rủi ro dài hạn, ngắn hạn (Ví dụ: "Hàm lượng đường quá cao, chứa chất bảo quản nhân tạo").
3. Chỉ ra thành phần cụ thể.

AI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP**:
1. Cấp thẻ màu, điểm số hoặc đánh giá mức độ rủi ro (Nghiêm cấm output từ "Sản phẩm này là Đỏ/Xanh", "Đây là sản phẩm tệ").
2. Viết câu dài lê thê giải thích chung chung về dinh dưỡng. Tổng số từ của Summary không được quá 50 từ tiếng Việt.

## 2. Prompt Interface & Template
```text
Role: Bạn là chuyên gia dinh dưỡng lâm sàng API (Không phải là chatbot).
Nhiệm vụ: Phân tích thành phần thực phẩm và tóm tắt rủi ro sức khỏe bằng ngữ cảnh tiếng Việt ngắn gọn, trực diện, dễ đọc (< 50 từ). Bạn KHÔNG quyết định mức độ an toàn (Xanh/Đỏ/Vàng). Chỉ trích xuất sự kiện.

Đầu vào (Input Context):
- product_name: {product_name}
- macro_sugar_100g: {sugar_100g}
- macro_salt_100g:  {salt_100g}
- ingredients_text: "{ingredients_text}"
- user_allergies_list: {allergies_json}

Ràng buộc (Rules):
1. KHÔNG thêm bất kỳ text nào ngoài JSON (No Markdown ```json wrappers).
2. Câu văn ở thuộc tính `ai_summary` phải ngắn gọn, dễ hiểu ở góc độ siêu thị (Tối đa 50 từ). Cảnh báo trực diện, không dài dòng.
3. Nếu "ingredients_text" rỗng hoặc quá ít, trả summary: "Không đủ thông tin để tóm tắt."
4. Liệt kê các thành phần dị ứng tìm thấy vào thuộc tính "detected_allergies" dựa rên user_allergies_list.

Đầu Ra (Output Format):
JSON ONLY theo Schema dưới đây.
```

## 3. Strict JSON Target Schema (Hợp đồng Trả Về)
Phía Backend HTTP Client sẽ tiến hành Deserialize phản hồi của AI theo Class/Record chuẩn xác nhất định bên dưới:

```json
{
  "type": "object",
  "properties": {
    "ai_summary": {
      "type": "string",
      "description": "Tóm tắt rủi ro < 50 chữ."
    },
    "detected_allergies": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Mảng chứa danh sách chất gây dị ứng phát hiện được từ Input."
    },
    "risk_ingredients": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Mảng danh mục các chất phụ gia/thành phần rủi ro (Ví dụ: 'Siro ngô', 'E171'). Giới hạn 5 phần tử."
    }
  },
  "required": ["ai_summary", "detected_allergies", "risk_ingredients"],
  "additionalProperties": false
}
```

## 4. Timeout policy & Error Mitigation
- API Call HTTP Client timeout sẽ được set cứng bằng `2000 miliseconds (2 giây)`.
- Nếu AI response trễ hơn 2 giây -> Hệ thống sinh ngoại lệ `AITimeoutException`. Xử lý block try/catch này bằng hàm dự phòng: Trả về Object AI trắng (Fallback).
```java
// Giả mã (Pseudo-code) cho Backend
public AiResult fetchAiSummary(Product input) {
    try {
        return aiClient.call(input, Duration.ofMillis(2000));
    } catch (TimeoutException | JsonParseException e) {
        log.warn("AI Call failed for barcode {}", input.getBarcode(), e);
         // Fallback Response
        return new AiResult(
           "Dữ liệu đang được phân tích bởi AI (Quá tải).",
           List.of(), List.of()
        );
    }
}
```

## 5. Token Limit Optimization
Vì OpenFoodFacts Payload rất lớn, để tối ưu **Cost-per-Scan** của Gemini, phần backend chỉ inject các trường cần thiết. Bỏ hết ảnh, metadata, location tag khỏi prompt.
Cắt chuỗi `ingredients_text` nếu dài hơn 1500 ký tự (Chắn rủi ro spam token overflow).
