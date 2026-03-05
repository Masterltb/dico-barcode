package com.dico.scan.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.*;

/**
 * Request wrapper that injects the authenticated userId as the X-User-Id
 * header.
 * This maintains backward compatibility with existing controllers that use
 * @RequestHeader("X-User-Id").
 *
 * IMPORTANT: Must override getHeader(), getHeaders(), AND getHeaderNames()
 * because Spring MVC's RequestHeaderMethodArgumentResolver can call any of
 * these
 * depending on the situation. Overriding only getHeader() is not sufficient and
 * causes MissingRequestHeaderException even when the header appears present.
 */
public class UserIdRequestWrapper extends HttpServletRequestWrapper {

    private static final String USER_ID_HEADER = "X-User-Id";
    private final String userId;

    public UserIdRequestWrapper(HttpServletRequest request, java.util.UUID userId) {
        super(request);
        this.userId = userId.toString();
    }

    @Override
    public String getHeader(String name) {
        if (USER_ID_HEADER.equalsIgnoreCase(name)) {
            return userId;
        }
        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        if (USER_ID_HEADER.equalsIgnoreCase(name)) {
            return Collections.enumeration(Collections.singletonList(userId));
        }
        return super.getHeaders(name);
    }

    @Override
    public Enumeration<String> getHeaderNames() {
        // Include X-User-Id in the header names list if not already present
        List<String> names = Collections.list(super.getHeaderNames());
        boolean alreadyPresent = names.stream()
                .anyMatch(USER_ID_HEADER::equalsIgnoreCase);
        if (!alreadyPresent) {
            names.add(USER_ID_HEADER);
        }
        return Collections.enumeration(names);
    }
}
