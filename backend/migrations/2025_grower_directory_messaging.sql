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
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_experience_years INTEGER CHECK (grower_experience_years >= 3); -- Minimum 3 years required
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_city TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_state TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_country TEXT DEFAULT 'USA';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_accepts_messages BOOLEAN DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_profile_image_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_farm_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_last_active TIMESTAMPTZ DEFAULT now();

-- OPTIONAL contact info (with risk disclosure required)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_address TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_contact_risk_acknowledged BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_contact_risk_acknowledged_date TIMESTAMPTZ;

-- Profile image moderation
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_image_approved BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_image_moderated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS grower_image_moderated_at TIMESTAMPTZ;

-- Create index for directory queries (only show growers with 3+ years experience)
CREATE INDEX IF NOT EXISTS idx_profiles_grower_directory ON profiles(grower_listed_in_directory, grower_state, grower_city)
  WHERE grower_listed_in_directory = true AND grower_experience_years >= 3;

-- Index for last active timestamp
CREATE INDEX IF NOT EXISTS idx_profiles_grower_last_active ON profiles(grower_last_active DESC)
  WHERE grower_listed_in_directory = true;

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

-- User moderation actions (warnings, suspensions, bans)
CREATE TABLE IF NOT EXISTS user_moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL CHECK (action_type IN ('warning', 'suspension', 'ban')),
  reason TEXT NOT NULL,
  moderator_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ, -- For temporary suspensions
  is_active BOOLEAN DEFAULT true,
  appeal_status TEXT CHECK (appeal_status IN ('none', 'pending', 'approved', 'denied')),
  appeal_text TEXT,
  appeal_date TIMESTAMPTZ,
  appeal_resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  appeal_resolved_at TIMESTAMPTZ
);

-- Message rate limiting tracking
CREATE TABLE IF NOT EXISTS message_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  new_conversation_count INTEGER DEFAULT 0,
  total_message_count INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Moderators table (who can moderate)
CREATE TABLE IF NOT EXISTS moderators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ DEFAULT now(),
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT ARRAY['moderate_messages', 'moderate_images', 'warn_users']
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
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_user ON user_moderation_actions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_moderation_actions_active ON user_moderation_actions(is_active, expires_at) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_message_rate_limits_user_date ON message_rate_limits(user_id, date);
CREATE INDEX IF NOT EXISTS idx_moderators_active ON moderators(is_active) WHERE is_active = true;

-- =====================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_read_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE moderators ENABLE ROW LEVEL SECURITY;

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

-- User Moderation Actions: Users can view their own moderation history
CREATE POLICY "Users can view their own moderation actions"
  ON user_moderation_actions FOR SELECT
  USING (user_id = auth.uid());

-- User Moderation Actions: Moderators can view all actions
CREATE POLICY "Moderators can view all moderation actions"
  ON user_moderation_actions FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM moderators WHERE is_active = true)
  );

-- User Moderation Actions: Moderators can create actions
CREATE POLICY "Moderators can create moderation actions"
  ON user_moderation_actions FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT user_id FROM moderators WHERE is_active = true)
  );

-- User Moderation Actions: Users can appeal
CREATE POLICY "Users can appeal their moderation actions"
  ON user_moderation_actions FOR UPDATE
  USING (user_id = auth.uid());

-- Message Rate Limits: Users can view their own rate limits
CREATE POLICY "Users can view their own rate limits"
  ON message_rate_limits FOR SELECT
  USING (user_id = auth.uid());

-- Message Rate Limits: System can update rate limits
CREATE POLICY "System can manage rate limits"
  ON message_rate_limits FOR ALL
  USING (true);

-- Moderators: Users can view active moderators
CREATE POLICY "Users can view active moderators"
  ON moderators FOR SELECT
  USING (is_active = true);

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

-- Function to check if user can send message (rate limiting)
CREATE OR REPLACE FUNCTION can_send_message(
  p_conversation_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_new_conversation BOOLEAN;
  v_today_new_conversations INTEGER;
  v_today_total_messages INTEGER;
  v_max_new_conversations INTEGER := 25; -- Max new conversations per day
  v_max_total_messages INTEGER := 100; -- Max total messages per day
  v_is_suspended BOOLEAN;
BEGIN
  -- Check if user is suspended or banned
  SELECT EXISTS(
    SELECT 1 FROM user_moderation_actions
    WHERE user_id = auth.uid()
      AND is_active = true
      AND action_type IN ('suspension', 'ban')
      AND (expires_at IS NULL OR expires_at > now())
  ) INTO v_is_suspended;

  IF v_is_suspended THEN
    RETURN false;
  END IF;

  -- Check if this is a new conversation (user hasn't sent messages here before)
  SELECT NOT EXISTS(
    SELECT 1 FROM messages
    WHERE conversation_id = p_conversation_id
      AND sender_id = auth.uid()
  ) INTO v_is_new_conversation;

  -- Get today's counts
  SELECT
    COALESCE(new_conversation_count, 0),
    COALESCE(total_message_count, 0)
  INTO v_today_new_conversations, v_today_total_messages
  FROM message_rate_limits
  WHERE user_id = auth.uid()
    AND date = CURRENT_DATE;

  -- Check limits
  IF v_is_new_conversation AND v_today_new_conversations >= v_max_new_conversations THEN
    RETURN false;
  END IF;

  IF v_today_total_messages >= v_max_total_messages THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

-- Function to increment message rate limit counters
CREATE OR REPLACE FUNCTION increment_message_count(
  p_conversation_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_new_conversation BOOLEAN;
BEGIN
  -- Check if this is a new conversation
  SELECT NOT EXISTS(
    SELECT 1 FROM messages
    WHERE conversation_id = p_conversation_id
      AND sender_id = auth.uid()
      AND created_at < now()
  ) INTO v_is_new_conversation;

  -- Insert or update rate limit record
  INSERT INTO message_rate_limits (user_id, date, new_conversation_count, total_message_count)
  VALUES (
    auth.uid(),
    CURRENT_DATE,
    CASE WHEN v_is_new_conversation THEN 1 ELSE 0 END,
    1
  )
  ON CONFLICT (user_id, date)
  DO UPDATE SET
    new_conversation_count = message_rate_limits.new_conversation_count + CASE WHEN v_is_new_conversation THEN 1 ELSE 0 END,
    total_message_count = message_rate_limits.total_message_count + 1;
END;
$$;

-- Function to check if user is a moderator
CREATE OR REPLACE FUNCTION is_moderator(p_user_id UUID DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := COALESCE(p_user_id, auth.uid());

  RETURN EXISTS(
    SELECT 1 FROM moderators
    WHERE user_id = v_user_id
      AND is_active = true
  );
END;
$$;

-- Function to update grower last active timestamp
CREATE OR REPLACE FUNCTION update_grower_last_active()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET grower_last_active = now()
  WHERE user_id = NEW.sender_id
    AND is_grower = true;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_grower_last_active
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_grower_last_active();

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
COMMENT ON TABLE user_moderation_actions IS 'Tracks warnings, suspensions, and bans with appeal process';
COMMENT ON TABLE message_rate_limits IS 'Rate limiting: 25 new conversations/day, 100 total messages/day';
COMMENT ON TABLE moderators IS 'Users with moderation permissions';

COMMENT ON COLUMN profiles.is_grower IS 'Whether user identifies as a grower';
COMMENT ON COLUMN profiles.grower_license_status IS 'Licensed, unlicensed, or not applicable';
COMMENT ON COLUMN profiles.grower_listed_in_directory IS 'Whether user consents to be listed in public grower directory';
COMMENT ON COLUMN profiles.grower_directory_consent_date IS 'When user consented to directory listing';
COMMENT ON COLUMN profiles.grower_experience_years IS 'Years of growing experience - minimum 3 required for directory listing';
COMMENT ON COLUMN profiles.grower_city IS 'Approximate location - city only (no exact address)';
COMMENT ON COLUMN profiles.grower_state IS 'Approximate location - state only';
COMMENT ON COLUMN profiles.grower_accepts_messages IS 'Whether grower accepts messages from other members';
COMMENT ON COLUMN profiles.grower_phone IS 'OPTIONAL phone number - user must acknowledge risks';
COMMENT ON COLUMN profiles.grower_address IS 'OPTIONAL address - user must acknowledge risks';
COMMENT ON COLUMN profiles.grower_contact_risk_acknowledged IS 'User acknowledged risks of sharing contact info';
COMMENT ON COLUMN profiles.grower_farm_name IS 'Farm or business name (not personal name)';
COMMENT ON COLUMN profiles.grower_profile_image_url IS 'Image of product/farm (not personal photos) - requires moderation approval';
COMMENT ON COLUMN profiles.grower_last_active IS 'Last time grower sent a message or was active';

