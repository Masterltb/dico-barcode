# Multi-Category Scoring Specification

## 1. Tổng quan
DICO Scan hỗ trợ 5 danh mục sản phẩm. Hệ thống tự động phát hiện category từ `categories_tags` của OpenFoodFacts và route sang logic scoring + AI prompt phù hợp.

## 2. Product Categories
```java
public enum ProductCategory {
    FOOD,    // Thực phẩm: Nutri/Nova/Additives scoring
    TOY,     // Đồ chơi: age_limit, choking hazard
    BEAUTY,  // Mỹ phẩm: paraben, sulfate, irritant
    FASHION, // Thời trang: textile chemicals, allergens
    GENERAL  // Chung: AI-only analysis
}
```

## 3. Category Detection
`ProductCategoryDetector.detect(List<String> categoriesTags)`:
- Scan toàn bộ `categories_tags` từ OFF API response.
- Match theo keyword patterns:
  - `*food*`, `*beverage*`, `*snack*` → `FOOD`
  - `*toy*`, `*game*`, `*children*` → `TOY`
  - `*beauty*`, `*cosmetic*`, `*skin*`, `*hair*` → `BEAUTY`
  - `*fashion*`, `*clothing*`, `*textile*` → `FASHION`
  - Không match → `GENERAL`

## 4. Scoring per Category

### FOOD (Deterministic — Spec 03)
```
Score = (N_Nutri * 0.4) + (N_Nova * 0.4) + (N_Additives * 0.2)
```
- N_Nutri: A=100, B=80, C=60, D=40, E=20, null=50
- N_Nova: 1=100, 2=80, 3=50, 4=10, null=50
- N_Additives: Start=100, Medium=-15, High=Override O1
- **Overrides**: O1 (Blacklist→39), O2 (Allergy→10), O3 (Missing→UNKNOWN)

### TOY / BEAUTY / FASHION / GENERAL
- Hiện tại **dùng chung** ScoringEngine với FOOD (cùng công thức).
- AI prompt được customize theo category (Section 5).
- `categoryWarning` field trong response cung cấp cảnh báo riêng biệt:
  - TOY: "Kiểm tra giới hạn tuổi và nguy cơ nuốt phải chi tiết nhỏ"
  - BEAUTY: "Phát hiện thành phần có thể gây kích ứng" (nếu có overrides)
  - FASHION: "Xem thành phần chất liệu để đánh giá phù hợp với da nhạy cảm"

## 5. AI Prompt per Category
Mỗi category có prompt template riêng trong `GeminiClient`:

| Category | Method | Chuyên gia Role |
|----------|--------|----------------|
| FOOD | `buildFoodPrompt()` | Dinh dưỡng lâm sàng |
| TOY | `buildToyPrompt()` | An toàn sản phẩm trẻ em |
| BEAUTY | `buildBeautyPrompt()` | An toàn mỹ phẩm |
| FASHION | `buildFashionPrompt()` | An toàn dệt may |
| GENERAL | `buildGeneralPrompt()` | Phân tích chung |

## 6. Response Fields
```json
{
  "category": "BEAUTY",
  "categoryWarning": "⚠️ Phát hiện thành phần có thể gây kích ứng",
  "riskFactors": ["Paraben", "SLS"]
}
```

## 7. Database
- Column `products.category` (`VARCHAR(30)`, default `'FOOD'`).
- Added in Flyway `V2__add_subscription_and_category.sql`.

## 8. Kế hoạch nâng cấp (Phase 2+)
- [ ] Tạo ScoringEngine riêng cho TOY (dựa trên tiêu chuẩn EN 71).
- [ ] Tạo ScoringEngine riêng cho BEAUTY (dựa trên INCI blacklist).
- [ ] ML-based category detection thay thế keyword matching.
