package com.dico.scan.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * Request body for PUT /v1/users/me/safety-profile
 * Contains the full safety profile questionnaire answers.
 *
 * VALIDATION:
 * - All list fields have max size limits
 * - Custom text fields: max 100 chars, only letters + spaces + commas
 * - Enum-type strings validated against allowed values in service layer
 */
public record SaveSafetyProfileRequest(

        /** Screen 1: Who is this profile for? e.g. ["SELF","CHILD","PREGNANT"] */
        @NotEmpty(message = "Phải chọn ít nhất 1 đối tượng") @Size(max = 5, message = "Tối đa 5 đối tượng") List<@Pattern(regexp = "^(SELF|CHILD|PREGNANT|MEDICAL|GENERAL)$", message = "Đối tượng không hợp lệ") String> targets,

        /** Child Branch — null if CHILD not in targets */
        @Valid ChildProfileRequest childProfile,

        /** Pregnancy Branch — null if PREGNANT not in targets */
        @Valid PregnancyProfileRequest pregnancyProfile,

        /** Screen 2: Food allergies from predefined list */
        @Size(max = 20, message = "Tối đa 20 dị ứng thực phẩm") List<@Size(max = 50) String> foodAllergies,

        /** Screen 2: Custom food allergies (free text, max 5) */
        @Size(max = 5, message = "Tối đa 5 dị ứng tùy chỉnh") List<@Size(max = 100, message = "Mỗi mục tối đa 100 ký tự") @Pattern(regexp = "^[\\p{L}\\p{N}\\s,/()-]+$", message = "Chỉ cho phép chữ, số, khoảng trắng") String> customFoodAllergies,

        /** Screen 3: Cosmetic sensitivities from predefined list */
        @Size(max = 15, message = "Tối đa 15 thành phần mỹ phẩm") List<@Size(max = 50) String> cosmeticSensitivities,

        /** Screen 3: Custom cosmetic sensitivities */
        @Size(max = 5, message = "Tối đa 5 mục tùy chỉnh") List<@Size(max = 100) @Pattern(regexp = "^[\\p{L}\\p{N}\\s,/()-]+$") String> customCosmeticSensitivities,

        /** Screen 4: Skin type — OILY/DRY/COMBINATION/SENSITIVE/UNKNOWN */
        @Pattern(regexp = "^(OILY|DRY|COMBINATION|SENSITIVE|UNKNOWN)?$", message = "Loại da không hợp lệ") String skinType,

        /** Screen 5: Health conditions */
        @Size(max = 10, message = "Tối đa 10 tình trạng sức khỏe") List<@Pattern(regexp = "^(PREGNANT|BREASTFEEDING|CHILD_UNDER_12|DIABETES|HYPERTENSION|KIDNEY_DISEASE|LIVER_DISEASE|NONE)$", message = "Tình trạng sức khỏe không hợp lệ") String> healthConditions,

        /** Screen 6: Dietary preferences */
        @Size(max = 5, message = "Tối đa 5 chế độ ăn") List<@Pattern(regexp = "^(VEGAN|VEGETARIAN|EAT_CLEAN|ORGANIC|HALAL|NONE)$", message = "Chế độ ăn không hợp lệ") String> dietaryPreferences,

        /** Screen 7: Alert level — STRICT/MODERATE/BASIC */
        @Pattern(regexp = "^(STRICT|MODERATE|BASIC)$", message = "Mức cảnh báo không hợp lệ") String alertLevel,

        /** Screen 8: Allergy severity — MILD/MODERATE/SEVERE */
        @Pattern(regexp = "^(MILD|MODERATE|SEVERE)$", message = "Mức dị ứng không hợp lệ") String allergySeverity) {

    /** Child Branch sub-request */
    public record ChildProfileRequest(
            @Pattern(regexp = "^(M0_6|M6_12|Y1_3|Y4_6|Y7_12|Y12_PLUS)$", message = "Nhóm tuổi không hợp lệ") String ageGroup,

            @Size(max = 20) List<@Size(max = 50) String> allergies,

            @Size(max = 5) List<@Size(max = 100) @Pattern(regexp = "^[\\p{L}\\p{N}\\s,/()-]+$") String> customAllergies,

            @Pattern(regexp = "^(MILD|MODERATE|SEVERE)$") String severityLevel) {
    }

    /** Pregnancy Branch sub-request */
    public record PregnancyProfileRequest(
            @Pattern(regexp = "^(TRIMESTER_1|TRIMESTER_2|TRIMESTER_3|UNKNOWN)$", message = "Giai đoạn thai kỳ không hợp lệ") String trimester,

            @Pattern(regexp = "^(STRICT|MODERATE|BASIC)$") String alertLevel) {
    }
}
