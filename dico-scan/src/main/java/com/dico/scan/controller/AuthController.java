package com.dico.scan.controller;

import com.dico.scan.dto.request.LoginRequest;
import com.dico.scan.dto.request.RegisterRequest;
import com.dico.scan.dto.response.AuthResponse;
import com.dico.scan.dto.response.StandardError;
import com.dico.scan.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * REST Controller for authentication (register + login).
 * These endpoints are PUBLIC — no JWT required.
 */
@Slf4j
@RestController
@RequestMapping("/v1/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "User registration and login")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user", description = "Creates a new user account with email + password. Returns JWT token on success.")
    public ResponseEntity<?> register(@RequestBody @Valid RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException ex) {
            // Email already exists
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new StandardError("EMAIL_EXISTS", ex.getMessage(), ""));
        }
    }

    @PostMapping("/login")
    @Operation(summary = "Login with email and password", description = "Authenticates user and returns JWT token.")
    public ResponseEntity<?> login(@RequestBody @Valid LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException ex) {
            // Invalid credentials
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(new StandardError("INVALID_CREDENTIALS", ex.getMessage(), ""));
        }
    }
}
