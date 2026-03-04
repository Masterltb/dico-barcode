package com.dico.scan.service;

import com.dico.scan.dto.request.LoginRequest;
import com.dico.scan.dto.request.RegisterRequest;
import com.dico.scan.dto.response.AuthResponse;
import com.dico.scan.entity.User;
import com.dico.scan.repository.UserRepository;
import com.dico.scan.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Authentication service: handles user registration and login.
 * Uses BCrypt for password hashing and JWT for token generation.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final JwtUtil jwtUtil;
    private static final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    /**
     * Register a new user.
     * 
     * @throws IllegalStateException if email already exists
     */
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // Check duplicate email
        if (userRepository.findByEmail(request.email().toLowerCase().trim()).isPresent()) {
            throw new IllegalStateException("Email đã được sử dụng: " + request.email());
        }

        User user = new User();
        user.setEmail(request.email().toLowerCase().trim());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setDisplayName(request.displayName() != null ? request.displayName().trim() : null);

        User saved = userRepository.save(user);
        log.info("User registered: id={}, email={}", saved.getId(), saved.getEmail());

        String token = jwtUtil.generateToken(saved.getId(), saved.getEmail());
        return new AuthResponse(
                token,
                saved.getId().toString(),
                saved.getEmail(),
                saved.getDisplayName(),
                saved.getSubscriptionTier().name());
    }

    /**
     * Login with email and password.
     * 
     * @throws IllegalArgumentException if credentials are invalid
     */
    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email().toLowerCase().trim())
                .orElseThrow(() -> new IllegalArgumentException("Email hoặc mật khẩu không đúng"));

        if (user.getPasswordHash() == null || !passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Email hoặc mật khẩu không đúng");
        }

        log.info("User logged in: id={}, email={}", user.getId(), user.getEmail());

        String token = jwtUtil.generateToken(user.getId(), user.getEmail());
        return new AuthResponse(
                token,
                user.getId().toString(),
                user.getEmail(),
                user.getDisplayName(),
                user.getSubscriptionTier().name());
    }
}
