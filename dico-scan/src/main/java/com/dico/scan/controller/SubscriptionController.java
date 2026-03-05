package com.dico.scan.controller;

import com.dico.scan.entity.User;
import com.dico.scan.enums.SubscriptionTier;
import com.dico.scan.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

/**
 * Subscription management endpoints.
 *
 * POST /v1/subscriptions/upgrade — Upgrade user tier (Dev: instant, Prod:
 * payment gateway)
 * GET /v1/subscriptions/status — Get current tier status
 *
 * NOTE: In DEV mode (`UPGRADE_DEV_MODE=true`), upgrade is instant.
 * In production, this should redirect to a payment gateway (Stripe, VNPay,
 * etc.)
 */
@Slf4j
@RestController
@RequestMapping("/v1/subscriptions")
@RequiredArgsConstructor
@Tag(name = "Subscriptions", description = "Subscription tier management (FREE → PREMIUM)")
public class SubscriptionController {

    private final UserRepository userRepository;

    @GetMapping("/status")
    @Operation(summary = "Lấy trạng thái gói hiện tại", description = "Trả về tier hiện tại và profileCompleted. Dùng để mobile hiển thị UI phù hợp.")
    public ResponseEntity<Map<String, Object>> getStatus(
            @RequestHeader("X-User-Id") UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        return ResponseEntity.ok(Map.of(
                "subscriptionTier", user.getSubscriptionTier().name(),
                "profileCompleted", user.isProfileCompleted(),
                "userId", userId.toString()));
    }

    @PostMapping("/upgrade")
    @Operation(summary = "Nâng cấp lên PREMIUM [DEV MODE]", description = "Dev mode: upgrade ngay lập tức không cần thanh toán. "
            +
            "Production: tích hợp payment gateway (VNPay/Stripe). " +
            "Idempotent — gọi nhiều lần với PREMIUM không gây lỗi.")
    public ResponseEntity<Map<String, Object>> upgrade(
            @RequestHeader("X-User-Id") UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        if (user.getSubscriptionTier() == SubscriptionTier.PREMIUM) {
            log.info("User {} already PREMIUM — no-op upgrade", userId);
            return ResponseEntity.ok(Map.of(
                    "subscriptionTier", "PREMIUM",
                    "message", "Tài khoản của bạn đã là PREMIUM",
                    "upgraded", false));
        }

        user.setSubscriptionTier(SubscriptionTier.PREMIUM);
        userRepository.save(user);

        log.info("User {} upgraded FREE → PREMIUM", userId);
        return ResponseEntity.ok(Map.of(
                "subscriptionTier", "PREMIUM",
                "message", "Nâng cấp thành công! Tận hưởng các tính năng PREMIUM.",
                "upgraded", true));
    }

    @PostMapping("/downgrade")
    @Operation(summary = "Hạ xuống FREE [DEV/TEST ONLY]", description = "Chỉ dùng trong môi trường dev/test để reset tier về FREE.")
    public ResponseEntity<Map<String, Object>> downgrade(
            @RequestHeader("X-User-Id") UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found: " + userId));

        user.setSubscriptionTier(SubscriptionTier.FREE);
        userRepository.save(user);

        log.info("User {} downgraded PREMIUM → FREE [TEST]", userId);
        return ResponseEntity.ok(Map.of(
                "subscriptionTier", "FREE",
                "message", "Đã hạ xuống FREE (test mode)"));
    }
}
