# Subscription Tier Specification

## 1. Tổng quan
DICO Scan hỗ trợ 2 gói dịch vụ để phân biệt trải nghiệm người dùng:

| Tier | Mô tả | Giá MVP |
|------|--------|---------|
| **FREE** | Scan cơ bản, scoring chung, AI generic | Miễn phí |
| **PREMIUM** | Full personalization: safety profile, allergy alerts, family profile | TBD |

## 2. Phân quyền theo Endpoint

| Endpoint | FREE | PREMIUM |
|----------|------|---------|
| `POST /v1/auth/register` | ✅ | ✅ |
| `POST /v1/auth/login` | ✅ | ✅ |
| `GET /v1/products/{barcode}` | ✅ Generic | ✅ Personalized |
| `PUT /v1/users/me/preferences` | ❌ 403 | ✅ |
| `PUT /v1/users/me/safety-profile` | ❌ 403 | ✅ |
| `GET /v1/users/me/safety-profile` | ✅ | ✅ |
| `POST /v1/contribute` | ✅ | ✅ |

## 3. Gating Logic trong Product Evaluation

### FREE Users
- `userAllergies` = empty → Override O2 (Allergy Conflict) **không kích hoạt**.
- AI prompt **không có** personal context → summary chung chung.
- `overrideReasons` lọc bỏ "Allergy conflict" entries.

### PREMIUM Users
- Load `preferences`, `safety_profile` từ DB.
- `extractAllAllergies()` gộp từ: `preferences.allergies` + `safetyProfile.foodAllergies` + `safetyProfile.customFoodAllergies` + `childProfile.allergies`.
- AI prompt append `buildPersonalContext()`.
- `overrideReasons` trả đầy đủ.

## 4. Enforcement
- `UserController.updatePreferences()` → check `user.getSubscriptionTier() != PREMIUM` → throw `PremiumRequiredException`.
- `SafetyProfileService.saveSafetyProfile()` → check tier → throw `PremiumRequiredException`.
- `PremiumRequiredException` → `GlobalExceptionHandler` → `403 Forbidden`.

## 5. Trạng thái hiện tại & Kế hoạch
- ✅ Tier gating cho scoring + preferences + safety profile.
- ❌ **Chưa có**: API nâng cấp FREE → PREMIUM (cần endpoint mới).
- ❌ **Chưa có**: In-App Purchase integration (Phase 2+).
