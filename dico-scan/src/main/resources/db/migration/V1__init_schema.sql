-- =================================================================
-- V1: Initial Schema for DICO Scan
-- =================================================================

-- -------------------------
-- TABLE: users
-- -------------------------
CREATE TABLE users (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email        VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    -- preferences JSONB format: {"allergies": ["peanuts","gluten"], "diet": "vegan"}
    preferences  JSONB NOT NULL DEFAULT '{"allergies":[],"diet":""}'::jsonb,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint on email
ALTER TABLE users ADD CONSTRAINT uq_users_email UNIQUE (email);

-- B-tree index for login lookups
CREATE INDEX idx_users_email ON users (email);

-- GIN index for JSONB allergy queries (e.g. WHERE preferences @> '{"allergies":["peanuts"]}')
CREATE INDEX idx_users_prefs_gin ON users USING GIN (preferences);


-- -------------------------
-- TABLE: products
-- -------------------------
CREATE TABLE products (
    barcode          VARCHAR(14) PRIMARY KEY,          -- EAN-8 to EAN-14
    name             VARCHAR(255),
    brand            VARCHAR(255),
    image_url        TEXT,
    -- Full snapshot of OpenFoodFacts API response
    off_payload      JSONB,
    -- Deterministic scoring results (computed, stored for cache)
    determin_score   SMALLINT CHECK (determin_score >= 0 AND determin_score <= 100),
    rating_color     VARCHAR(10) CHECK (rating_color IN ('GREEN','YELLOW','RED','UNKNOWN')),
    confidence_score REAL NOT NULL DEFAULT 1.0 CHECK (confidence_score >= 0.0 AND confidence_score <= 1.0),
    -- AI layer (optional, can be NULL)
    ai_summary_cache TEXT,
    ai_inputs_hash   VARCHAR(64),                      -- SHA-256 hash of AI input for cache invalidation
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for cache TTL cleanup job
CREATE INDEX idx_products_updated ON products (updated_at DESC);
-- Index for fast AI cache lookup
CREATE INDEX idx_products_ai_hash ON products (ai_inputs_hash) WHERE ai_inputs_hash IS NOT NULL;


-- -------------------------
-- TABLE: scan_history
-- -------------------------
-- NOTE: For MVP this is a regular table. Range partitioning by month is Phase 2+.
CREATE TABLE scan_history (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id        UUID NOT NULL,
    barcode        VARCHAR(14) NOT NULL,
    scanned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    snapshot_color VARCHAR(10)  -- Stores rating at time of scan for historical accuracy
);

-- Foreign keys
ALTER TABLE scan_history
    ADD CONSTRAINT fk_scan_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE;

ALTER TABLE scan_history
    ADD CONSTRAINT fk_scan_product FOREIGN KEY (barcode) REFERENCES products (barcode) ON DELETE SET NULL;

-- Composite index: primary query pattern is "fetch history for user, ordered by time"
CREATE INDEX idx_scan_hist_user_time ON scan_history (user_id, scanned_at DESC);
