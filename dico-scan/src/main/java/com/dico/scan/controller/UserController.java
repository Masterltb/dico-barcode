package com.dico.scan.controller;

import com.dico.scan.dto.request.UpdatePreferencesRequest;
import com.dico.scan.entity.User;
import com.dico.scan.enums.SubscriptionTier;
import com.dico.scan.exception.PremiumRequiredException;
import com.dico.scan.repository.UserRepository;
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
 * Premium gate: Only PREMIUM users can save personal allergy preferences.
 */
@Slf4j
@RestController
@RequestMapping("/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User profile and allergy preferences management")
public class UserController {

    private final UserService userService;
    private final UserRepository userRepository;

    @PutMapping("/me/preferences")
    @Operation(summary = "Update user allergy preferences [PREMIUM ONLY]", description = "Updates personal allergy list and diet preference. Requires PREMIUM subscription. FREE users receive 403.")
    public ResponseEntity<Void> updatePreferences(
            @RequestHeader("X-User-Id") UUID userId,
            @RequestBody @Valid UpdatePreferencesRequest request) {
        log.info("Preferences update request: userId={}", userId);

        // Premium gate: check subscription tier
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (user.getSubscriptionTier() != SubscriptionTier.PREMIUM) {
            throw new PremiumRequiredException("Personalized allergy preferences");
        }

        userService.updatePreferences(userId, request);
        return ResponseEntity.ok().build();
    }
}
