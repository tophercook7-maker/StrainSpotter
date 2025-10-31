-- Make room_id nullable and backfill for feedback messages
ALTER TABLE messages ALTER COLUMN room_id DROP NOT NULL;
-- Optionally, set room_id for all feedback messages to the Feedback group id
UPDATE messages SET room_id = (SELECT id FROM groups WHERE name = 'Feedback' LIMIT 1) WHERE group_id IS NOT NULL AND room_id IS NULL;
-- Optionally, set a default for room_id (if desired)
-- ALTER TABLE messages ALTER COLUMN room_id SET DEFAULT (SELECT id FROM groups WHERE name = 'Feedback' LIMIT 1);
