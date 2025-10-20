-- Friends System Migration
-- Bidirectional friendship with request/accept flow

CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  friend_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
  requested_at timestamptz DEFAULT now(),
  accepted_at timestamptz,
  UNIQUE(user_id, friend_id),
  CHECK (user_id != friend_id)
);

-- Index for fast friend lookups
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- RLS policies: users can see their own friend requests and accepted friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can see friendships where they are either user_id or friend_id
CREATE POLICY friendships_select_own ON public.friendships 
  FOR SELECT 
  USING (true); -- Permissive for now; tighten in prod with auth.uid()

-- Users can create friend requests (insert)
CREATE POLICY friendships_insert_own ON public.friendships 
  FOR INSERT 
  WITH CHECK (true); -- Permissive for now

-- Users can update friendship status if they are the recipient (friend_id)
CREATE POLICY friendships_update_recipient ON public.friendships 
  FOR UPDATE 
  USING (true); -- Permissive for now

-- Add user_id column to scans if not exists (for privacy filtering)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scans' AND column_name='user_id') THEN
    ALTER TABLE public.scans ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Update scans policies to filter by friendship
DROP POLICY IF EXISTS scans_select_all ON public.scans;
CREATE POLICY scans_select_friends ON public.scans 
  FOR SELECT 
  USING (
    -- Allow if user owns the scan OR is friends with the owner
    user_id IS NULL OR -- public scans (no owner)
    true -- Permissive for dev; in prod, check friendship via EXISTS subquery
  );

-- Function to check if two users are friends (accepted status)
CREATE OR REPLACE FUNCTION public.are_friends(uid1 uuid, uid2 uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.friendships
    WHERE status = 'accepted'
      AND ((user_id = uid1 AND friend_id = uid2) OR (user_id = uid2 AND friend_id = uid1))
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE public.friendships IS 'Bidirectional friend requests and accepted friendships';
COMMENT ON FUNCTION public.are_friends IS 'Check if two users are friends (accepted status)';
