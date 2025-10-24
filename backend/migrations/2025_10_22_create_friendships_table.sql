-- Create friendships table for social features
CREATE TABLE IF NOT EXISTS public.friendships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  friend_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  -- Prevent duplicate friend requests
  UNIQUE(user_id, friend_id),
  -- Prevent self-friending
  CHECK (user_id != friend_id)
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- RLS policies for friendships
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view their own friendships (both directions)
CREATE POLICY "Users can view their friendships"
  ON public.friendships
  FOR SELECT
  USING (
    auth.uid() = user_id 
    OR auth.uid() = friend_id
  );

-- Users can create friendship requests
CREATE POLICY "Users can create friendship requests"
  ON public.friendships
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sent or received requests
CREATE POLICY "Users can update friendship status"
  ON public.friendships
  FOR UPDATE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = friend_id
  );

-- Users can delete their own friendships
CREATE POLICY "Users can delete friendships"
  ON public.friendships
  FOR DELETE
  USING (
    auth.uid() = user_id 
    OR auth.uid() = friend_id
  );

-- Optional: Add a users table for usernames if not exists
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);

-- RLS for users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users are viewable by everyone"
  ON public.users
  FOR SELECT
  USING (true);

CREATE POLICY "Users can update their own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.users
  FOR INSERT
  WITH CHECK (auth.uid() = id);
