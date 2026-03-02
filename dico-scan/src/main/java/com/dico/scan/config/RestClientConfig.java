package com.dico.scan.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

/**
 * Configures the RestTemplate used for OpenFoodFacts API calls.
 * Uses a dedicated bean (@Qualifier) to isolate timeout settings
 * from any other RestTemplate beans in the application.
 */
@Slf4j
@Configuration
public class RestClientConfig {

    @Value("${app.off.connect-timeout-ms:1000}")
    private int connectTimeout;

    @Value("${app.off.read-timeout-ms:3000}")
    private int readTimeout;

    @Value("${app.off.user-agent:DicoScan-Default-UA}")
    private String userAgent;

    @Bean("offRestTemplate")
    public RestTemplate offRestTemplate() {
        SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(connectTimeout);
        factory.setReadTimeout(readTimeout);

        RestTemplate restTemplate = new RestTemplate(factory);

        // Add mandatory User-Agent header for OFF ethics policy (Spec 07)
        restTemplate.setInterceptors(Collections.singletonList((request, body, execution) -> {
            request.getHeaders().set("User-Agent", userAgent);
            request.getHeaders().set("Accept", "application/json");
            return execution.execute(request, body);
        }));

        log.info("OFF RestTemplate configured: connectTimeout={}ms, readTimeout={}ms", connectTimeout, readTimeout);
        return restTemplate;
    }
}
