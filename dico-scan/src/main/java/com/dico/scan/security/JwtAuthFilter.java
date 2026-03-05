package com.dico.scan.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * JWT Authentication Filter.
 * Extracts userId from JWT Bearer token and injects it into the request via
 * UserIdRequestWrapper (which overrides X-User-Id header).
 *
 * RULES:
 * - Public endpoints (auth, product scan, contribute, swagger, actuator):
 * userId is optional — request is passed through even without a token.
 * - Protected endpoints (preferences, safety-profile): require valid JWT.
 * No token → 401 Unauthorized.
 *
 * This allows anonymous users to call GET /v1/products/{barcode}
 * while still protecting PREMIUM-only endpoints.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public static final String USER_ID_ATTR = "authenticatedUserId";

    /** Fully skip filter for public infra paths (no auth needed at all). */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/v1/auth/")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
                || path.startsWith("/api-docs")
                || path.startsWith("/actuator");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        UUID userId = null;

        // 1) Try JWT Bearer token
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            userId = jwtUtil.validateToken(token);
            if (userId == null) {
                // Token provided but invalid/expired → always 401
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter()
                        .write("{\"errorCode\":\"INVALID_TOKEN\",\"message\":\"Token không hợp lệ hoặc đã hết hạn\"}");
                return;
            }
        }

        // 2) Fallback: X-User-Id header (dev/test backward compat)
        if (userId == null) {
            String headerUserId = request.getHeader("X-User-Id");
            if (headerUserId != null && !headerUserId.isBlank()) {
                try {
                    userId = UUID.fromString(headerUserId);
                } catch (IllegalArgumentException ex) {
                    log.debug("Invalid X-User-Id header: {}", headerUserId);
                }
            }
        }

        // 3) Check if this endpoint REQUIRES authentication
        if (userId == null && isProtectedEndpoint(request)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"errorCode\":\"UNAUTHORIZED\",\"message\":\"Vui lòng đăng nhập để sử dụng tính năng này\"}");
            return;
        }

        // 4) Pass through — inject userId if available
        if (userId != null) {
            request.setAttribute(USER_ID_ATTR, userId);
            filterChain.doFilter(new UserIdRequestWrapper(request, userId), response);
        } else {
            // Anonymous request to a public endpoint — pass through as-is
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Endpoints that REQUIRE authentication.
     * Anonymous access to these should be rejected with 401.
     */
    private boolean isProtectedEndpoint(HttpServletRequest request) {
        String path = request.getRequestURI();
        String method = request.getMethod();

        // Preferences update — PREMIUM
        if (path.equals("/v1/users/me/preferences") && "PUT".equalsIgnoreCase(method))
            return true;
        // Safety profile — PREMIUM save
        if (path.equals("/v1/users/me/safety-profile"))
            return true;

        return false;
    }
}
