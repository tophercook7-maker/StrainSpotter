-- =====================================================
-- GROWER DIRECTORY + MESSAGING SYSTEM
-- =====================================================
-- This migration adds:
-- 1. Grower profiles with opt-in directory listing
-- 2. License status tracking (licensed/unlicensed)
-- 3. Approximate location (city/state only, no exact address)
-- 4. Private messaging system for member-to-member communication
-- 5. Privacy controls and consent tracking
-- =====================================================

-- =====================================================
-- 1. GROWER PROFILES
-- =====================================================

-- Add grower-related columns to user profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_grower BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_license_status TEXT CHECK (grower_license_status IN ('licensed', 'unlicensed', 'not_applicable'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_listed_in_directory BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_directory_consent_date TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_specialties TEXT[]; -- e.g., ['indoor', 'outdoor', 'organic', 'hydroponics']
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_experience_years INTEGER;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_country TEXT DEFAULT 'USA';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_accepts_messages BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_profile_image_url TEXT;

-- Create index for directory queries
CREATE INDEX IF NOT EXISTS idx_profiles_grower_directory ON profiles(grower_listed_in_directory, grower_state, grower_city) WHERE grower_listed_in_directory = true;

-- =====================================================
-- 2. MESSAGING SYSTEM
-- =====================================================

-- Conversations table (1-on-1 or group chats)
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_type TEXT NOT NULL CHECK (conversation_type IN ('direct', 'group')),
  title TEXT, -- For group chats
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Conversation participants (who's in each conversation)
CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ DEFAULT now(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  last_read_at TIMESTAMPTZ DEFAULT now(),
  notifications_enabled BOOLEAN DEFAULT true,
  UNIQUE(conversation_id, user_id)
);

-- Messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'system')),
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Moderation fields
  is_flagged BOOLEAN DEFAULT false,
  flagged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  flagged_at TIMESTAMPTZ,
  flag_reason TEXT,
  is_moderated BOOLEAN DEFAULT false,
  moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  moderated_at TIMESTAMPTZ,
  moderation_action TEXT CHECK (moderation_action IN ('approved', 'removed', 'warning'))
);

-- Message read receipts
CREATE TABLE IF NOT EXISTS message_read_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  read_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Blocked users (prevent unwanted messages)
CREATE TABLE IF NOT EXISTS blocked_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  UNIQUE(blocker_id, blocked_id)
);

-- =====================================================
-- 3. INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_conversation_participants_user ON conversation_participants(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_conversation ON conversation_participants(conversation_id, is_active);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_flagged ON messages(is_flagged, is_moderated) WHERE is_flagged = true;
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON blocked_users(blocked_id);

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;

-- Conversations: Users can see conversations they're part of
CREATE POLICY "Users can view their own conversations"
  ON conversations FOR SELECT
  USING (
    id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Conversations: Users can create conversations
CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- Conversation Participants: Users can view participants in their conversations
CREATE POLICY "Users can view participants in their conversations"
  ON conversation_participants FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Conversation Participants: Users can add themselves to conversations
CREATE POLICY "Users can join conversations"
  ON conversation_participants FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Conversation Participants: Users can leave conversations
CREATE POLICY "Users can leave conversations"
  ON conversation_participants FOR UPDATE
  USING (user_id = auth.uid());

-- Messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND is_deleted = false
  );

-- Messages: Users can send messages to their conversations
CREATE POLICY "Users can send messages to their conversations"
  ON messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Messages: Users can edit/delete their own messages
CREATE POLICY "Users can edit their own messages"
  ON messages FOR UPDATE
  USING (sender_id = auth.uid());

-- Messages: Users can flag messages
CREATE POLICY "Users can flag messages"
  ON messages FOR UPDATE
  USING (
    conversation_id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Read Receipts: Users can mark messages as read
CREATE POLICY "Users can mark messages as read"
  ON message_read_receipts FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view read receipts in their conversations"
  ON message_read_receipts FOR SELECT
  USING (
    message_id IN (
      SELECT id FROM messages
      WHERE conversation_id IN (
        SELECT conversation_id FROM conversation_participants
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- Blocked Users: Users can manage their own blocked list
CREATE POLICY "Users can view their blocked list"
  ON blocked_users FOR SELECT
  USING (blocker_id = auth.uid());

CREATE POLICY "Users can block other users"
  ON blocked_users FOR INSERT
  WITH CHECK (blocker_id = auth.uid());

CREATE POLICY "Users can unblock users"
  ON blocked_users FOR DELETE
  USING (blocker_id = auth.uid());

-- =====================================================
-- 5. HELPER FUNCTIONS
-- =====================================================

-- Function to create a direct conversation between two users
CREATE OR REPLACE FUNCTION create_direct_conversation(
  other_user_id UUID
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  existing_conversation_id UUID;
  new_conversation_id UUID;
BEGIN
  -- Check if conversation already exists
  SELECT c.id INTO existing_conversation_id
  FROM conversations c
  WHERE c.conversation_type = 'direct'
    AND c.id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = auth.uid() AND is_active = true
    )
    AND c.id IN (
      SELECT conversation_id FROM conversation_participants
      WHERE user_id = other_user_id AND is_active = true
    )
  LIMIT 1;

  IF existing_conversation_id IS NOT NULL THEN
    RETURN existing_conversation_id;
  END IF;

  -- Create new conversation
  INSERT INTO conversations (conversation_type, created_by)
  VALUES ('direct', auth.uid())
  RETURNING id INTO new_conversation_id;

  -- Add both participants
  INSERT INTO conversation_participants (conversation_id, user_id)
  VALUES 
    (new_conversation_id, auth.uid()),
    (new_conversation_id, other_user_id);

  RETURN new_conversation_id;
END;
$$;

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(
  p_conversation_id UUID DEFAULT NULL
)
RETURNS TABLE (
  conversation_id UUID,
  unread_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.conversation_id,
    COUNT(*)::BIGINT as unread_count
  FROM messages m
  INNER JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
  WHERE cp.user_id = auth.uid()
    AND cp.is_active = true
    AND m.created_at > cp.last_read_at
    AND m.sender_id != auth.uid()
    AND m.is_deleted = false
    AND (p_conversation_id IS NULL OR m.conversation_id = p_conversation_id)
  GROUP BY m.conversation_id;
END;
$$;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Update conversation updated_at when new message is sent
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET updated_at = now()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_conversation_timestamp
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_timestamp();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE conversations IS 'Stores all conversations (direct and group)';
COMMENT ON TABLE conversation_participants IS 'Tracks which users are in which conversations';
COMMENT ON TABLE messages IS 'Stores all messages with moderation support';
COMMENT ON TABLE message_read_receipts IS 'Tracks when users read messages';
COMMENT ON TABLE blocked_users IS 'Allows users to block unwanted contacts';

COMMENT ON COLUMN profiles.is_grower IS 'Whether user identifies as a grower';
COMMENT ON COLUMN profiles.grower_license_status IS 'Licensed, unlicensed, or not applicable';
COMMENT ON COLUMN profiles.grower_listed_in_directory IS 'Whether user consents to be listed in public grower directory';
COMMENT ON COLUMN profiles.grower_directory_consent_date IS 'When user consented to directory listing';
COMMENT ON COLUMN profiles.grower_city IS 'Approximate location - city only (no exact address)';
COMMENT ON COLUMN profiles.grower_state IS 'Approximate location - state only';
COMMENT ON COLUMN profiles.grower_accepts_messages IS 'Whether grower accepts messages from other members';

