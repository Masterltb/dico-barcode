package com.dico.scan.service;

import com.dico.scan.dto.request.UpdatePreferencesRequest;
import com.dico.scan.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    /**
     * Idempotent update of user allergy preferences.
     * Uses @Modifying JPQL update to avoid loading the full User entity.
     */
    @Transactional
    public void updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        boolean exists = userRepository.existsById(userId);
        if (!exists) {
            throw new RuntimeException("User not found: " + userId);
        }

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("allergies", request.allergies());
        prefs.put("diet", request.diet() != null ? request.diet() : "");

        int updated = userRepository.updatePreferences(userId, prefs);
        log.info("Preferences updated for userId={}, allergies={}, diet={}", userId, request.allergies(),
                request.diet());
        if (updated == 0) {
            log.warn("No rows updated for userId={}", userId);
        }
    }
}
