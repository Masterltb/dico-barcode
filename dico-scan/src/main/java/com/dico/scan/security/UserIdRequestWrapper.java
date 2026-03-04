package com.dico.scan.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.UUID;

/**
 * Request wrapper that injects X-User-Id header from JWT-authenticated userId.
 * This maintains backward compatibility with existing controllers that use
 * @RequestHeader("X-User-Id").
 */
public class UserIdRequestWrapper extends HttpServletRequestWrapper {

    private final UUID userId;

    public UserIdRequestWrapper(HttpServletRequest request, UUID userId) {
        super(request);
        this.userId = userId;
    }

    @Override
    public String getHeader(String name) {
        if ("X-User-Id".equalsIgnoreCase(name)) {
            return userId.toString();
        }
        return super.getHeader(name);
    }
}
