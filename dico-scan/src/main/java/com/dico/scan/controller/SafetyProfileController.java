package com.dico.scan.controller;

import com.dico.scan.dto.request.SaveSafetyProfileRequest;
import com.dico.scan.dto.response.SafetyProfileResponse;
import com.dico.scan.service.SafetyProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST Controller for Safety Profile (Questionnaire Wizard).
 * PREMIUM ONLY — FREE users receive 403.
 */
@Slf4j
@RestController
@RequestMapping("/v1/users/me/safety-profile")
@RequiredArgsConstructor
@Tag(name = "Safety Profile", description = "Personalized safety profile questionnaire (PREMIUM)")
public class SafetyProfileController {

    private final SafetyProfileService profileService;

    @PutMapping
    @Operation(summary = "Save safety profile [PREMIUM]", description = "Saves the complete questionnaire answers. Validates and sanitizes all inputs.")
    public ResponseEntity<Void> saveSafetyProfile(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody @Valid SaveSafetyProfileRequest request) {
        log.info("Safety profile save request: userId={}, targets={}", userId, request.targets());
        profileService.saveSafetyProfile(userId, request);
        return ResponseEntity.ok().build();
    }

    @GetMapping
    @Operation(summary = "Get safety profile", description = "Returns the user's current safety profile for the confirmation screen.")
    public ResponseEntity<SafetyProfileResponse> getSafetyProfile(
            @RequestHeader("X-User-Id") UUID userId) {
        SafetyProfileResponse profile = profileService.getSafetyProfile(userId);
        return ResponseEntity.ok(profile);
    }
}
