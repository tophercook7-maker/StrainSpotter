-- Add group_id column to messages table and set up foreign key to groups.id
ALTER TABLE messages ADD COLUMN group_id uuid;
ALTER TABLE messages ADD CONSTRAINT messages_group_id_fkey FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE SET NULL;
-- (Optional) If you want to backfill existing messages to a default group, you can do it here.
-- UPDATE messages SET group_id = (SELECT id FROM groups WHERE name = 'Feedback' LIMIT 1) WHERE group_id IS NULL;
