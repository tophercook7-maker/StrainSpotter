-- Create direct_messages table for 1-on-1 private messaging
CREATE TABLE IF NOT EXISTS direct_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  read_at TIMESTAMPTZ,
  
  -- Indexes for performance
  CONSTRAINT direct_messages_sender_receiver_check CHECK (sender_id != receiver_id)
);

-- Create indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON direct_messages(sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON direct_messages(receiver_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON direct_messages(sender_id, receiver_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE direct_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only see messages they sent or received
CREATE POLICY "Users can view their own messages"
  ON direct_messages
  FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages"
  ON direct_messages
  FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their sent messages"
  ON direct_messages
  FOR UPDATE
  USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their sent messages"
  ON direct_messages
  FOR DELETE
  USING (auth.uid() = sender_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON direct_messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON direct_messages TO service_role;

