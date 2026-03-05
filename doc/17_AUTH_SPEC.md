# Authentication Specification

## 1. Tổng quan
Xác thực stateless qua JWT token. Password hash bằng BCrypt. Mọi user đăng ký mặc định gói FREE.

## 2. Endpoints

### POST `/v1/auth/register`
- **Request**: `RegisterRequest(email, password, displayName?)`
- **Validation**: email unique, password 6-100 chars, displayName max 100 chars.
- **Logic**: Lowercase + trim email → BCrypt hash password → save User → generate JWT → return `AuthResponse`.
- **Responses**: `201 Created` | `409 Conflict` (email exists).

### POST `/v1/auth/login`
- **Request**: `LoginRequest(email, password)`
- **Logic**: Find by email → BCrypt match password → generate JWT → return `AuthResponse`.
- **Responses**: `200 OK` | `401 Unauthorized` (invalid credentials).

## 3. AuthResponse Schema
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "userId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "displayName": "Nguyen Van A",
  "subscriptionTier": "FREE"
}
```

## 4. JWT Implementation
- **Class**: `JwtUtil`
- **Algorithm**: HS256
- **Claims**: userId (UUID), email
- **Usage**: Mobile app gửi `Authorization: Bearer <token>` header.
- **Context**: `X-User-Id` header chứa UUID user, dùng trong các request cần authentication.

## 5. Password Security
- **Hash**: `BCryptPasswordEncoder` (Spring Security).
- **Raw password**: KHÔNG bao giờ lưu.
- **Validation**: Minimum 6 ký tự.

## 6. Files liên quan
| File | Vai trò |
|------|---------|
| `AuthController.java` | REST endpoints register/login |
| `AuthService.java` | Business logic, JWT generation |
| `JwtUtil.java` | JWT token utility |
| `RegisterRequest.java` | Request DTO with validation |
| `LoginRequest.java` | Request DTO |
| `AuthResponse.java` | Response DTO |
