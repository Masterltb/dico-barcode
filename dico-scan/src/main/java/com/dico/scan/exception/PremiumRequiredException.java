package com.dico.scan.exception;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.ResponseStatus;

/**
 * Thrown when a FREE user attempts to access a PREMIUM-only feature.
 * Results in HTTP 403 Forbidden.
 */
@ResponseStatus(HttpStatus.FORBIDDEN)
public class PremiumRequiredException extends RuntimeException {

    public PremiumRequiredException(String feature) {
        super("PREMIUM subscription required to access: " + feature);
    }
}
