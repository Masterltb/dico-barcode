package com.dico.scan.service;

import com.dico.scan.dto.request.UpdatePreferencesRequest;
import com.dico.scan.entity.User;
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
     * Loads the User entity to take advantage of Hibernate JSONB mappings.
     */
    @Transactional
    public void updatePreferences(UUID userId, UpdatePreferencesRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        Map<String, Object> prefs = new HashMap<>();
        prefs.put("allergies", request.allergies());
        prefs.put("diet", request.diet() != null ? request.diet() : "");

        user.setPreferences(prefs);
        userRepository.save(user);

        log.info("Preferences updated for userId={}, allergies={}, diet={}", userId, request.allergies(),
                request.diet());
    }
}
