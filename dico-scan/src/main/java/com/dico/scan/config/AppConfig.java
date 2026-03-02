package com.dico.scan.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.util.concurrent.TimeUnit;

/**
 * Application-level configuration.
 * Enables @Async for non-blocking AI calls and @Scheduled for cache cleanup
 * jobs.
 */
@Configuration
@EnableAsync
@EnableScheduling
public class AppConfig {

    /**
     * Caffeine in-memory cache.
     * Used for hot product data to avoid repeated DB hits within the same JVM
     * instance.
     * TTL = 1 hour, max 1000 entries (Guardrail Rule 5 — only cache Immutable
     * records).
     *
     * NOTE: On Cloud Run with multiple instances, this is per-instance local cache.
     * For multi-instance consistency, Redis would be needed (Phase 2+).
     */
    @Bean
    public CacheManager cacheManager() {
        CaffeineCacheManager manager = new CaffeineCacheManager("products");
        manager.setCaffeine(
                Caffeine.newBuilder()
                        .expireAfterWrite(1, TimeUnit.HOURS)
                        .maximumSize(1000));
        return manager;
    }
}
