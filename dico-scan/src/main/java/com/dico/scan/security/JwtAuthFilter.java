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
 * Extracts userId from JWT Bearer token and sets it as a request attribute.
 * Falls back to X-User-Id header for backward compatibility (dev/test).
 *
 * Skip filter for: /v1/auth/**, /swagger-ui/**, /api-docs/**, /actuator/**
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;

    public static final String USER_ID_ATTR = "authenticatedUserId";

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path.startsWith("/v1/auth/")
                || path.startsWith("/swagger-ui")
                || path.startsWith("/v3/api-docs")
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
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter()
                        .write("{\"errorCode\":\"INVALID_TOKEN\",\"message\":\"Token không hợp lệ hoặc đã hết hạn\"}");
                return;
            }
        }

        // 2) Fallback: X-User-Id header (backward compat for dev/test)
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

        // 3) No auth at all → 401
        if (userId == null) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType("application/json");
            response.getWriter().write("{\"errorCode\":\"UNAUTHORIZED\",\"message\":\"Vui lòng đăng nhập\"}");
            return;
        }

        // Set userId as request attribute for controllers
        request.setAttribute(USER_ID_ATTR, userId);

        // Also set X-User-Id header for backward compat with existing controller code
        // Controllers still read @RequestHeader("X-User-Id") — we wrap the request
        filterChain.doFilter(new UserIdRequestWrapper(request, userId), response);
    }
}
