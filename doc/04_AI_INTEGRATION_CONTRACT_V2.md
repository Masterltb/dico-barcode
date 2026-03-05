# AI Integration Contract V2 (Cập nhật — Multi-category + PREMIUM Personalization)

Tài liệu xác định giao kèo bắt buộc cho việc tích hợp AI (Gemini 1.5 Flash / 2.5 Flash). Mở rộng với prompt routing theo danh mục sản phẩm và ngữ cảnh cá nhân PREMIUM.

## 1. Responsibility Boundary
AI **ĐƯỢC PHÉP**:
1. Đọc danh sách thành phần (ingredients_text / materials).
2. Tóm tắt rủi ro < 50 từ tiếng Việt.
3. Chỉ ra thành phần cụ thể đáng lo ngại.
4. Phát hiện dị ứng chéo (cross-contamination) cho PREMIUM users.

AI **TUYỆT ĐỐI KHÔNG ĐƯỢC PHÉP**:
1. Cấp thẻ màu, điểm số hoặc đánh giá mức độ rủi ro.
2. Viết câu dài hơn 50 từ tiếng Việt.

## 2. Multi-Category Prompt Routing
`GeminiClient.buildPrompt()` chọn template dựa trên `ProductCategory`:

| Category | Prompt Template | Chuyên gia | Focus |
|----------|----------------|-----------|-------|
| FOOD | `buildFoodPrompt()` | Dinh dưỡng lâm sàng | Sugar, salt, additives, dị ứng |
| TOY | `buildToyPrompt()` | An toàn sản phẩm trẻ em | Giới hạn tuổi, nguy cơ nuốt, vật liệu |
| BEAUTY | `buildBeautyPrompt()` | An toàn mỹ phẩm | Paraben, SLS/SLES, formaldehyde, hương liệu |
| FASHION | `buildFashionPrompt()` | An toàn dệt may | Azo dye, hóa chất nhuộm, phù hợp da nhạy cảm |
| GENERAL | `buildGeneralPrompt()` | Phân tích chung | Thông tin tổng quát |

## 3. PREMIUM Personalization Context
Khi user là PREMIUM và đã hoàn thành Safety Profile wizard, hệ thống append `buildPersonalContext()` vào prompt:
- Đối tượng sử dụng (SELF, CHILD, PREGNANT)
- Profile trẻ em: độ tuổi, dị ứng, mức phản ứng
- Profile thai kỳ: giai đoạn
- Dị ứng thực phẩm + dị ứng hiếm/ẩn
- Nhạy cảm mỹ phẩm + loại da (cho BEAUTY)
- Tình trạng sức khỏe + chế độ ăn
- Mức dị ứng (MILD/MODERATE/SEVERE)
- Yêu cầu bổ sung: cross-contamination, tên gọi ẩn (casein = sữa)

## 4. Strict JSON Target Schema
```json
{
  "ai_summary": "Tóm tắt rủi ro < 50 chữ.",
  "detected_allergies": ["allergen1", "allergen2"],
  "risk_ingredients": ["E171", "Siro ngô"]
}
```
- `ai_summary` (string, required): < 50 từ tiếng Việt.
- `detected_allergies` (array, required): Chất gây dị ứng phát hiện. Rỗng nếu không có.
- `risk_ingredients` (array, required): Thành phần rủi ro. Tối đa 5.

## 5. Timeout & Fallback
- **Connect Timeout:** `5000ms`. **Read Timeout:** `12000ms`.
- **Fallback** khi timeout hoặc lỗi:
```java
new AiAnalysisResult(
    "Dữ liệu đang được phân tích. Vui lòng thử lại sau.",
    Collections.emptyList(), Collections.emptyList()
);
```
- Response cleaning: Strip ````json` wrappers trước khi deserialize.

## 6. Token Limit Optimization
- Cắt `ingredients_text` tại `1500` ký tự (`app.ai.max-ingredients-length`).
- Chỉ inject trường cần thiết, bỏ hết ảnh, metadata, location.

## 7. Configuration
```yaml
app:
  ai:
    gemini-key: ${GEMINI_API_KEY}
    gemini-url: https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent
    max-ingredients-length: 1500
```
