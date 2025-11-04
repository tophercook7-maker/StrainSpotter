-- Fix messages table: Make user_id nullable since we're using sender_id now
-- The old schema had user_id, the new schema uses sender_id
-- Both columns exist, but user_id has a NOT NULL constraint

-- Make user_id nullable
ALTER TABLE messages ALTER COLUMN user_id DROP NOT NULL;

-- Optional: Set user_id = sender_id for existing messages to maintain consistency
UPDATE messages SET user_id = sender_id WHERE user_id IS NULL AND sender_id IS NOT NULL;

-- Add a comment to explain the dual columns
COMMENT ON COLUMN messages.user_id IS 'Legacy column - use sender_id instead. Kept for backward compatibility.';
COMMENT ON COLUMN messages.sender_id IS 'Current column for message sender. References auth.users(id).';

