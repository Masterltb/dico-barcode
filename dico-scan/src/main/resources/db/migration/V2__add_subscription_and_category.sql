-- V2: Add subscription tier to users + category to products table
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_tier VARCHAR(20) NOT NULL DEFAULT 'FREE';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_data jsonb DEFAULT '{}';

ALTER TABLE products ADD COLUMN IF NOT EXISTS category VARCHAR(30) NOT NULL DEFAULT 'FOOD';
