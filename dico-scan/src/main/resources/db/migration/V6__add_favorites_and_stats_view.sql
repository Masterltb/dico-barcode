-- V6__add_favorites_and_stats_view.sql
-- Tính năng: Danh sách yêu thích sản phẩm (Favorites/Wishlist)

-- ── Favorites table ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_favorites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL,
    barcode     VARCHAR(14) NOT NULL,
    label       VARCHAR(20) NOT NULL DEFAULT 'SAFE',   -- 'SAFE' = Mua lại | 'AVOID' = Tránh mua
    note        TEXT,                                   -- Ghi chú tùy chọn của user
    added_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Mỗi user chỉ có 1 entry mỗi barcode
    CONSTRAINT uq_user_barcode UNIQUE (user_id, barcode),

    -- label chỉ cho phép 2 giá trị
    CONSTRAINT chk_favorite_label CHECK (label IN ('SAFE', 'AVOID'))
);

-- Index tìm tất cả favorites của user (phổ biến nhất)
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON user_favorites (user_id, added_at DESC);

-- Index tìm barcode cụ thể đã có trong favorites chưa (dùng trong ResultScreen)
CREATE INDEX IF NOT EXISTS idx_favorites_barcode ON user_favorites (user_id, barcode);

COMMENT ON TABLE user_favorites IS 'User product favorites — SAFE (buy again) or AVOID (do not buy)';
COMMENT ON COLUMN user_favorites.label IS 'SAFE = Mua lại, AVOID = Tránh mua';
