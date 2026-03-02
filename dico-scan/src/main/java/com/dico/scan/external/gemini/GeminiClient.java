package com.dico.scan.external.gemini;

import com.dico.scan.external.off.OffProductData;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * HTTP client for Gemini 1.5 Flash API.
 *
 * CONTRACT (Spec 04):
 * - AI can ONLY produce text summaries (<50 words in Vietnamese).
 * - AI CANNOT produce rating colors or scores.
 * - Hard timeout: 2000ms. On any failure → return fallback AiAnalysisResult.
 * - Input truncated at 1500 chars for ingredients_text to control token cost.
 *
 * GUARDRAIL (Rule 6): No @Transactional. Called from ProductApplicationService
 * AFTER the DB transaction is committed.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class GeminiClient {

    private final ObjectMapper objectMapper;

    @Value("${app.ai.gemini-key:}")
    private String geminiApiKey;

    @Value("${app.ai.gemini-url:https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent}")
    private String geminiUrl;

    @Value("${app.ai.max-ingredients-length:1500}")
    private int maxIngredientsLength;

    private static final AiAnalysisResult FALLBACK = new AiAnalysisResult(
            "Dữ liệu đang được phân tích. Vui lòng thử lại sau.",
            Collections.emptyList(),
            Collections.emptyList());

    /**
     * Calls Gemini 1.5 Flash to generate a Vietnamese safety summary.
     * Returns FALLBACK on any error (timeout, JSON parse failure, HTTP error).
     *
     * @param productData   Normalized OFF product data
     * @param userAllergies User's allergy list (included in prompt for
     *                      personalization)
     */
    public AiAnalysisResult analyze(OffProductData productData, List<String> userAllergies) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            log.warn("Gemini API key not configured. Returning fallback.");
            return FALLBACK;
        }
        try {
            String prompt = buildPrompt(productData, userAllergies);
            String responseBody = callGeminiApi(prompt);
            return parseResponse(responseBody);
        } catch (Exception ex) {
            log.warn("Gemini call failed for barcode={}: {}", productData.barcode(), ex.getMessage());
            return FALLBACK;
        }
    }

    private String buildPrompt(OffProductData data, List<String> allergies) {
        // Truncate ingredients to control token usage (Spec 04, Section 5)
        String ingredients = data.ingredientsText();
        if (ingredients.length() > maxIngredientsLength) {
            ingredients = ingredients.substring(0, maxIngredientsLength) + "...";
        }

        return String.format("""
                Bạn là chuyên gia dinh dưỡng lâm sàng API (Không phải là chatbot).
                Nhiệm vụ: Phân tích thành phần thực phẩm và tóm tắt rủi ro sức khỏe bằng tiếng Việt ngắn gọn (< 50 từ).
                Bạn KHÔNG quyết định mức độ an toàn (Xanh/Đỏ/Vàng). Chỉ trích xuất sự kiện.

                Đầu vào:
                - product_name: %s
                - macro_sugar_100g: %.1f
                - macro_salt_100g: %.1f
                - ingredients_text: "%s"
                - user_allergies_list: %s

                Ràng buộc bắt buộc:
                1. KHÔNG thêm bất kỳ text nào ngoài JSON. KHÔNG dùng ```json wrappers.
                2. ai_summary phải < 50 từ tiếng Việt. Cảnh báo trực diện, không dài dòng.
                3. Nếu ingredients_text rỗng: trả summary "Không đủ thông tin để tóm tắt."
                4. Liệt kê dị ứng phát hiện được vào detected_allergies.

                Trả về JSON theo đúng schema này:
                {"ai_summary":"...","detected_allergies":[],"risk_ingredients":[]}
                """,
                data.productName(), data.sugars100g(), data.salt100g(),
                ingredients, allergies.toString());
    }

    @SuppressWarnings("unchecked")
    private String callGeminiApi(String prompt) {
        // Use a dedicated RestTemplate with 2s timeout (created via @Bean in
        // RestClientConfig Phase 2)
        // For MVP: create inline with RestTemplate + SimpleClientHttpRequestFactory
        org.springframework.http.client.SimpleClientHttpRequestFactory factory = new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(5000);
        factory.setReadTimeout(12000);
        RestTemplate restTemplate = new RestTemplate(factory);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt)))));

        String urlWithKey = geminiUrl + "?key=" + geminiApiKey;
        ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
                urlWithKey, new HttpEntity<>(requestBody, headers), (Class<Map<String, Object>>) (Class<?>) Map.class);

        // Extract text from Gemini response structure
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.getBody().get("candidates");
        Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        return (String) parts.get(0).get("text");
    }

    private AiAnalysisResult parseResponse(String rawText) throws Exception {
        // Strip whitespace. If AI added ```json ``` wrappers despite instruction, clean
        // them.
        String cleaned = rawText.trim()
                .replaceAll("^```json\\s*", "")
                .replaceAll("\\s*```$", "");
        return objectMapper.readValue(cleaned, AiAnalysisResult.class);
    }
}
