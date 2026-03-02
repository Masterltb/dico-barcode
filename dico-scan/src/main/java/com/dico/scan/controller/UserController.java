package com.dico.scan.controller;

import com.dico.scan.dto.request.UpdatePreferencesRequest;
import com.dico.scan.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for user profile and preferences management.
 * Maps to OpenAPI spec: PUT /v1/users/me/preferences
 *
 * MVP: userId passed as request header X-User-Id.
 * Phase 2: Extract userId from JWT claim.
 */
@Slf4j
@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and allergy preferences management")
public class UserController {

    private final UserService userService;

    @PutMapping("/me/preferences")
    @Operation(summary = "Update user allergy preferences (Idempotent)", description = "Updates the user's allergy list and diet preference. Safe to call multiple times with same payload.")
    public ResponseEntity<Void> updatePreferences(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody @Valid UpdatePreferencesRequest request) {
        log.info("Preferences update request: userId={}", userId);
        userService.updatePreferences(userId, request);
        return ResponseEntity.ok().build();
    }
}
