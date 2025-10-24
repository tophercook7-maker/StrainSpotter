-- Moderation Reports table
CREATE TABLE IF NOT EXISTS moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  reported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reason TEXT NOT NULL DEFAULT 'inappropriate',
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  action_taken TEXT CHECK (action_taken IN ('approve', 'remove', 'warn', 'ban')),
  moderator_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_moderation_reports_status ON moderation_reports(status);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_message_id ON moderation_reports(message_id);
CREATE INDEX IF NOT EXISTS idx_moderation_reports_created_at ON moderation_reports(created_at DESC);

-- RLS policies (adjust based on your auth setup)
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;

-- Anyone can report a message
CREATE POLICY "Users can report messages" ON moderation_reports
  FOR INSERT
  WITH CHECK (true);

-- Only admins can view reports (you'll need an admin role or check)
CREATE POLICY "Admins can view all reports" ON moderation_reports
  FOR SELECT
  USING (true); -- TODO: Add admin role check

-- Only admins can update reports
CREATE POLICY "Admins can update reports" ON moderation_reports
  FOR UPDATE
  USING (true); -- TODO: Add admin role check
