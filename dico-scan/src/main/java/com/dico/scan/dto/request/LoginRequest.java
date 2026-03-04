package com.dico.scan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Request body for POST /v1/auth/login
 */
public record LoginRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") String email,

        @NotBlank(message = "Mật khẩu không được để trống") String password) {
}
