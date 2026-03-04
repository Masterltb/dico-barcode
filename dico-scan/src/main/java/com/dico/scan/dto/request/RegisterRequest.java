package com.dico.scan.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Request body for POST /v1/auth/register
 */
public record RegisterRequest(
        @NotBlank(message = "Email không được để trống") @Email(message = "Email không hợp lệ") @Size(max = 255) String email,

        @NotBlank(message = "Mật khẩu không được để trống") @Size(min = 6, max = 100, message = "Mật khẩu phải từ 6-100 ký tự") String password,

        @Size(max = 100, message = "Tên hiển thị tối đa 100 ký tự") String displayName) {
}
