-- =================================================================
-- V5: Seed Users for Testing
-- Dev/Test accounts — DO NOT run on production.
--
-- Accounts:
--   PREMIUM: premium@dico.test / Test@1234
--   FREE:    free@dico.test    / Test@1234
--
-- BCrypt(cost=10) hash of "Test@1234" — verified via BCryptPasswordEncoder
-- =================================================================

-- -----------------------------------------------
-- 1. PREMIUM user — full safety profile + allergies
-- -----------------------------------------------
INSERT INTO users (
    email,
    password_hash,
    display_name,
    subscription_tier,
    preferences,
    profile_data,
    safety_profile,
    profile_completed
) VALUES (
    'premium@dico.test',
    '$2a$10$bplSR0/qMhnKGY7c05OdlebhZ78QzyTR6wjNfOyBTwA7LjRsfbeSy',
    'Test Premium User',
    'PREMIUM',
    '{"allergies": ["peanut", "gluten", "shellfish"], "diet": "VEGAN"}'::jsonb,
    '{}'::jsonb,
    '{
        "targets": ["SELF"],
        "foodAllergies": ["peanut", "gluten", "shellfish"],
        "customFoodAllergies": ["hat de"],
        "cosmeticSensitivities": ["paraben", "sls"],
        "customCosmeticSensitivities": [],
        "skinType": "SENSITIVE",
        "healthConditions": ["NONE"],
        "dietaryPreferences": ["VEGAN"],
        "alertLevel": "STRICT",
        "allergySeverity": "SEVERE"
    }'::jsonb,
    true
)
ON CONFLICT (email) DO UPDATE SET
    subscription_tier = 'PREMIUM',
    password_hash     = '$2a$10$bplSR0/qMhnKGY7c05OdlebhZ78QzyTR6wjNfOyBTwA7LjRsfbeSy',
    safety_profile    = EXCLUDED.safety_profile,
    profile_completed = true,
    updated_at        = NOW();


-- -----------------------------------------------
-- 2. FREE user — no personalization
-- -----------------------------------------------
INSERT INTO users (
    email,
    password_hash,
    display_name,
    subscription_tier,
    preferences,
    profile_data,
    safety_profile,
    profile_completed
) VALUES (
    'free@dico.test',
    '$2a$10$bplSR0/qMhnKGY7c05OdlebhZ78QzyTR6wjNfOyBTwA7LjRsfbeSy',
    'Test Free User',
    'FREE',
    '{"allergies": [], "diet": ""}'::jsonb,
    '{}'::jsonb,
    '{}'::jsonb,
    false
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = '$2a$10$bplSR0/qMhnKGY7c05OdlebhZ78QzyTR6wjNfOyBTwA7LjRsfbeSy',
    updated_at    = NOW();
