package com.dico.scan.external.off;

import com.dico.scan.exception.ExternalServiceException;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Map;
import java.util.Optional;

/**
 * HTTP client for OpenFoodFacts API v2.
 *
 * GUARDRAIL (Rule 6): This class has NO @Transactional annotations.
 * It must never be called while holding a DB connection.
 * The orchestrator in ProductApplicationService controls transaction scope.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class OpenFoodFactsClient {

    private final RestTemplate offRestTemplate;

    @Value("${app.off.base-url:https://world.openfoodfacts.org/api/v2}")
    private String baseUrl;

    /**
     * Fetches product data from OpenFoodFacts API.
     * Returns Optional.empty() if: product 404, circuit open (fallback), or
     * unrecoverable error.
     * Other errors (5xx) will be retried per Resilience4j config, then fall to
     * circuit breaker.
     *
     * @param barcode EAN barcode string
     */
    @Retry(name = "offApi")
    @CircuitBreaker(name = "offApi", fallbackMethod = "offFallback")
    public Optional<OffProductData> fetchProduct(String barcode) {
        String url = baseUrl + "/product/" + barcode + ".json";
        log.debug("Fetching OFF product: {}", url);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> response = offRestTemplate.getForObject(url, Map.class);

            if (response == null || !"1".equals(String.valueOf(response.get("status")))) {
                log.info("OFF product not found for barcode: {}", barcode);
                return Optional.empty(); // Product doesn't exist — triggers ProductNotFoundException upstream
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> rawProduct = (Map<String, Object>) response.get("product");
            return Optional.of(OffResponseParser.parse(barcode, rawProduct));

        } catch (HttpClientErrorException ex) {
            if (ex.getStatusCode() == HttpStatus.NOT_FOUND) {
                log.info("OFF 404 for barcode: {}", barcode);
                return Optional.empty();
            }
            // 4xx (non-404) — don't retry, re-throw as external service error
            throw new ExternalServiceException("OpenFoodFacts", ex);
        }
    }

    /**
     * Fallback activated when circuit breaker is OPEN or retries exhausted.
     * Returns empty Optional — ProductApplicationService will throw
     * ProductNotFoundException.
     */
    public Optional<OffProductData> offFallback(String barcode, Throwable ex) {
        log.warn("OFF API circuit breaker OPEN for barcode {}. Reason: {}", barcode, ex.getMessage());
        return Optional.empty();
    }
}
