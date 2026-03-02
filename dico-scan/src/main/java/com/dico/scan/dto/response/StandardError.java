package com.dico.scan.dto.response;

/**
 * Standard error envelope for all API error responses.
 * Matches OpenAPI V2 StandardError schema.
 * trace_id should be attached by GlobalExceptionHandler on every error.
 */
public record StandardError(
        String errorCode,
        String message,
        String traceId) {
}
