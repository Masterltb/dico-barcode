-- V3: Add safety_profile JSONB and profile_completed flag to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS safety_profile jsonb DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_completed boolean NOT NULL DEFAULT false;
