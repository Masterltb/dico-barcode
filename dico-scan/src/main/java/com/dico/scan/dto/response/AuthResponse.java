package com.dico.scan.dto.response;

/**
 * Response for successful login/register.
 * Contains JWT token and basic user info for the mobile app.
 */
public record AuthResponse(
        String token,
        String userId,
        String email,
        String displayName,
        String subscriptionTier) {
}
