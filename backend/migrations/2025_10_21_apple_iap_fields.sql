-- Migration: Add Apple IAP fields to club_memberships
-- Run in Supabase SQL Editor

ALTER TABLE club_memberships
ADD COLUMN IF NOT EXISTS apple_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS apple_original_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS receipt_data TEXT;

-- Index for fast lookup by Apple transaction IDs
CREATE INDEX IF NOT EXISTS idx_club_memberships_apple_transaction 
ON club_memberships(apple_transaction_id);

CREATE INDEX IF NOT EXISTS idx_club_memberships_apple_original_transaction 
ON club_memberships(apple_original_transaction_id);

-- Comments
COMMENT ON COLUMN club_memberships.apple_transaction_id IS 'Latest Apple transaction ID from StoreKit 2';
COMMENT ON COLUMN club_memberships.apple_original_transaction_id IS 'Original Apple transaction ID (persistent across renewals)';
COMMENT ON COLUMN club_memberships.receipt_data IS 'Latest StoreKit 2 signedPayload (JWS) for verification';
