package com.dico.scan.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Per-IP Rate Limiting Filter using Bucket4j token-bucket algorithm.
 *
 * Strategy:
 * - /v1/products/{barcode} (scan) : 20 req/min/IP → main protection
 * - /v1/auth/* (auth) : 5 req/min/IP → brute-force protection
 * - Other endpoints : unlimited (handled by business logic)
 *
 * Implementation: In-memory ConcurrentHashMap per IP.
 * Production note: Replace with Redis-backed Bucket4j for multi-instance
 * deployments.
 *
 * GUARDRAIL: Responds 429 Too Many Requests with JSON body.
 */
@Slf4j
@Component
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${app.rate-limit.scan-per-minute:20}")
    private int scanRateLimit;

    @Value("${app.rate-limit.auth-per-minute:5}")
    private int authRateLimit;

    // Separate buckets per IP per endpoint type
    private final ConcurrentHashMap<String, Bucket> scanBuckets = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, Bucket> authBuckets = new ConcurrentHashMap<>();

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {
        String path = request.getRequestURI();
        String clientIp = extractClientIp(request);

        Bucket bucket = null;

        if (path.startsWith("/v1/products/")) {
            bucket = scanBuckets.computeIfAbsent(clientIp, ip -> buildBucket(scanRateLimit));
        } else if (path.startsWith("/v1/auth/")) {
            bucket = authBuckets.computeIfAbsent(clientIp, ip -> buildBucket(authRateLimit));
        }

        if (bucket != null && !bucket.tryConsume(1)) {
            log.warn("Rate limit exceeded: path={} ip={}", path, clientIp);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter().write("""
                    {"status":429,"error":"Too Many Requests","message":"Rate limit exceeded. Please slow down."}
                    """);
            return;
        }

        filterChain.doFilter(request, response);
    }

    /**
     * Cleans up to avoid memory leak — evict stale entries periodically if needed.
     */
    private Bucket buildBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(requestsPerMinute)
                .refillGreedy(requestsPerMinute, Duration.ofMinutes(1))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Extracts real client IP — handles reverse proxy via X-Forwarded-For.
     * Trust only the first IP in the chain.
     */
    private String extractClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }

    /** Skip rate limiting for internal paths and Swagger */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/actuator")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs");
    }
}
