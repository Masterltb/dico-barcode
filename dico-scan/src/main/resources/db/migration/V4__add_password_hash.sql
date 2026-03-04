-- V4: Add password_hash column for authentication
ALTER TABLE users ADD COLUMN password_hash VARCHAR(255);
