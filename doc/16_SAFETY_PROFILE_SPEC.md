# Safety Profile Wizard Specification

## 1. Tổng quan
Safety Profile Wizard là bảng khảo sát 8 bước giúp PREMIUM users cung cấp thông tin cá nhân hóa. Dữ liệu được lưu vào cột JSONB `users.safety_profile` và dùng để:
1. Tăng cường Override O2 (Allergy Conflict) trong Scoring Engine.
2. Cung cấp ngữ cảnh cá nhân cho AI prompt (PREMIUM only).

## 2. Luồng API
- **Lưu**: `PUT /v1/users/me/safety-profile` — Controller → Service (sanitize + validate → save)
- **Xem**: `GET /v1/users/me/safety-profile` — Controller → Service (load from DB → `SafetyProfileResponse.fromMap()`)

## 3. Cấu trúc Questionnaire (8 Screens)

| Screen | Field | Type | Validation |
|--------|-------|------|-----------|
| 1 | `targets` | `List<String>` | Required, 1-5 items. Enum: SELF/CHILD/PREGNANT/MEDICAL/GENERAL |
| 1a | `childProfile` | Object | Conditional: chỉ khi targets chứa "CHILD" |
| 1b | `pregnancyProfile` | Object | Conditional: chỉ khi targets chứa "PREGNANT" |
| 2 | `foodAllergies` | `List<String>` | Max 20 items |
| 2 | `customFoodAllergies` | `List<String>` | Max 5, regex `[\\p{L}\\p{N}\\s,/()-]+`, max 100 chars each |
| 3 | `cosmeticSensitivities` | `List<String>` | Max 15 items |
| 3 | `customCosmeticSensitivities` | `List<String>` | Max 5, max 100 chars |
| 4 | `skinType` | `String` | Enum: OILY/DRY/COMBINATION/SENSITIVE/UNKNOWN |
| 5 | `healthConditions` | `List<String>` | Max 10. Enum set |
| 6 | `dietaryPreferences` | `List<String>` | Max 5. Enum set |
| 7 | `alertLevel` | `String` | Enum: STRICT/MODERATE/BASIC |
| 8 | `allergySeverity` | `String` | Enum: MILD/MODERATE/SEVERE |

### Child Branch
| Field | Type | Validation |
|-------|------|-----------|
| `ageGroup` | String | Enum: M0_6/M6_12/Y1_3/Y4_6/Y7_12/Y12_PLUS |
| `allergies` | `List<String>` | Max 20 |
| `customAllergies` | `List<String>` | Max 5, max 100 chars |
| `severityLevel` | String | Enum: MILD/MODERATE/SEVERE |

### Pregnancy Branch
| Field | Type | Validation |
|-------|------|-----------|
| `trimester` | String | Enum: TRIMESTER_1/TRIMESTER_2/TRIMESTER_3/UNKNOWN |
| `alertLevel` | String | Enum: STRICT/MODERATE/BASIC |

## 4. Data Sanitization (Service Layer)
`SafetyProfileService.buildCleanProfile()` thực hiện:
- **cleanList()**: Trim, filter null/empty, deduplicate.
- **sanitizeCustomList()**: Strip HTML tags, remove `<>"';&` chars, limit 100 chars, deduplicate.

## 5. JSONB Storage Schema
```json
{
  "targets": ["SELF", "CHILD"],
  "childProfile": {
    "ageGroup": "Y4_6",
    "allergies": ["peanut", "gluten"],
    "customAllergies": ["hạt dẻ"],
    "severityLevel": "MODERATE"
  },
  "foodAllergies": ["peanut", "shellfish"],
  "customFoodAllergies": ["hạt dẻ"],
  "cosmeticSensitivities": ["paraben", "sls"],
  "skinType": "SENSITIVE",
  "healthConditions": ["DIABETES"],
  "dietaryPreferences": ["VEGAN"],
  "alertLevel": "STRICT",
  "allergySeverity": "SEVERE"
}
```

## 6. Integration Points
- **ScoringEngine**: `extractAllAllergies()` gộp foodAllergies + customFoodAllergies + childProfile.allergies.
- **GeminiClient**: `buildPersonalContext()` append toàn bộ profile vào prompt AI.
- **User Entity**: `user.setProfileCompleted(true)` sau khi lưu thành công.
