-- ========================================
-- STRAINSPOTTER COMPLETE DATABASE MIGRATION
-- Run this entire file in Supabase SQL Editor
-- ========================================

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- CORE TABLES
-- ========================================

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE,
  email text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now(),
  subscription_tier text, -- 'scan', 'full', or NULL
  subscription_expiry timestamptz
);

-- Strains
CREATE TABLE IF NOT EXISTS public.strains (
  slug text PRIMARY KEY,
  name text,
  type text,
  description text,
  effects text[],
  flavors text[],
  lineage text,
  thc float,
  cbd float,
  lab_test_results jsonb,
  seed_sources jsonb,
  grow_guide jsonb
);

-- Grow Logs (create before scans due to FK)
CREATE TABLE IF NOT EXISTS public.grow_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  strain_slug text REFERENCES public.strains(slug) ON DELETE SET NULL,
  stage text,
  notes text,
  images text[],
  health_status jsonb,
  remedies jsonb,
  progress jsonb,
  created_at timestamptz DEFAULT now()
);

-- Scans
CREATE TABLE IF NOT EXISTS public.scans (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  image_url text,
  image_key text,
  matched_strain_slug text REFERENCES public.strains(slug) ON DELETE SET NULL,
  status text DEFAULT 'pending',
  result jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  plant_age text,
  plant_health jsonb,
  grow_log_id uuid REFERENCES public.grow_logs(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_scans_image_key ON public.scans(image_key);

COMMENT ON COLUMN public.scans.image_key IS 'Supabase Storage object key (users/{owner}/{filename})';

-- ========================================
-- SOCIAL & COMMUNITY TABLES
-- ========================================

-- Friendships (bidirectional friend system)
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

-- Groups
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.group_members (
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  joined_at timestamptz DEFAULT now(),
  PRIMARY KEY (group_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid REFERENCES public.groups(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- MARKETPLACE TABLES
-- ========================================

-- Growers
CREATE TABLE IF NOT EXISTS public.growers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  location text,
  specialties text[],
  available_strains text[],
  seed_sources jsonb,
  reputation int,
  badges text[],
  created_at timestamptz DEFAULT now()
);

-- Seeds (seed banks/vendors)
CREATE TABLE IF NOT EXISTS public.seeds (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  strain_slug text REFERENCES public.strains(slug) ON DELETE SET NULL,
  name text,
  breeder text,
  type text,
  thc float,
  cbd float,
  description text,
  price_per_seed decimal,
  url text,
  created_at timestamptz DEFAULT now()
);

-- Dispensaries
CREATE TABLE IF NOT EXISTS public.dispensaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  address text,
  city text,
  state text,
  zip text,
  phone text,
  website text,
  description text,
  available_strains text[],
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- ADDITIONAL FEATURES
-- ========================================

-- Journals
CREATE TABLE IF NOT EXISTS public.journals (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  scan_id uuid REFERENCES public.scans(id) ON DELETE SET NULL,
  content text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Events
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text,
  location text,
  date timestamptz,
  description text,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL
);

-- Feedback
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  content text,
  type text, -- 'bug', 'feature', 'general'
  status text DEFAULT 'open', -- 'open', 'reviewed', 'closed'
  created_at timestamptz DEFAULT now()
);

-- ========================================
-- INDEXES
-- ========================================

-- Friendship indexes
CREATE INDEX IF NOT EXISTS idx_friendships_user_id ON public.friendships(user_id);
CREATE INDEX IF NOT EXISTS idx_friendships_friend_id ON public.friendships(friend_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON public.friendships(status);

-- Scan indexes
CREATE INDEX IF NOT EXISTS idx_scans_user_id ON public.scans(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_created_at ON public.scans(created_at DESC);

-- Group indexes
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages(group_id);

-- Strain indexes
CREATE INDEX IF NOT EXISTS idx_strains_type ON public.strains(type);
CREATE INDEX IF NOT EXISTS idx_strains_name ON public.strains(name);

-- ========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grow_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS scans_select_all ON public.scans;
DROP POLICY IF EXISTS scans_insert_all ON public.scans;
DROP POLICY IF EXISTS scans_update_all ON public.scans;
DROP POLICY IF EXISTS scans_select_friends ON public.scans;

-- Scans policies (privacy-aware)
CREATE POLICY scans_select_friends ON public.scans 
  FOR SELECT 
  USING (
    user_id IS NULL OR -- public scans
    true -- Permissive for dev; in prod: auth.uid() = user_id OR are_friends(auth.uid(), user_id)
  );

CREATE POLICY scans_insert_all ON public.scans 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY scans_update_all ON public.scans 
  FOR UPDATE 
  USING (true);

-- Grow logs policies
CREATE POLICY growlogs_select_all ON public.grow_logs FOR SELECT USING (true);
CREATE POLICY growlogs_insert_all ON public.grow_logs FOR INSERT WITH CHECK (true);
CREATE POLICY growlogs_update_all ON public.grow_logs FOR UPDATE USING (true);

-- Groups policies
CREATE POLICY groups_select_all ON public.groups FOR SELECT USING (true);
CREATE POLICY groups_insert_all ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY groups_update_all ON public.groups FOR UPDATE USING (true);

-- Group members policies
CREATE POLICY group_members_select_all ON public.group_members FOR SELECT USING (true);
CREATE POLICY group_members_insert_all ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY group_members_update_all ON public.group_members FOR UPDATE USING (true);

-- Messages policies
CREATE POLICY messages_select_all ON public.messages FOR SELECT USING (true);
CREATE POLICY messages_insert_all ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY messages_update_all ON public.messages FOR UPDATE USING (true);

-- Growers policies
CREATE POLICY growers_select_all ON public.growers FOR SELECT USING (true);
CREATE POLICY growers_insert_all ON public.growers FOR INSERT WITH CHECK (true);
CREATE POLICY growers_update_all ON public.growers FOR UPDATE USING (true);

-- Journals policies
CREATE POLICY journals_select_all ON public.journals FOR SELECT USING (true);
CREATE POLICY journals_insert_all ON public.journals FOR INSERT WITH CHECK (true);
CREATE POLICY journals_update_all ON public.journals FOR UPDATE USING (true);

-- Events policies
CREATE POLICY events_select_all ON public.events FOR SELECT USING (true);
CREATE POLICY events_insert_all ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY events_update_all ON public.events FOR UPDATE USING (true);

-- Friendships policies
CREATE POLICY friendships_select_own ON public.friendships 
  FOR SELECT 
  USING (true); -- Permissive for dev

CREATE POLICY friendships_insert_own ON public.friendships 
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY friendships_update_recipient ON public.friendships 
  FOR UPDATE 
  USING (true);

-- Seeds policies (public read)
CREATE POLICY seeds_select_all ON public.seeds FOR SELECT USING (true);
CREATE POLICY seeds_insert_all ON public.seeds FOR INSERT WITH CHECK (true);
CREATE POLICY seeds_update_all ON public.seeds FOR UPDATE USING (true);

-- Dispensaries policies (public read)
CREATE POLICY dispensaries_select_all ON public.dispensaries FOR SELECT USING (true);
CREATE POLICY dispensaries_insert_all ON public.dispensaries FOR INSERT WITH CHECK (true);
CREATE POLICY dispensaries_update_all ON public.dispensaries FOR UPDATE USING (true);

-- Feedback policies
CREATE POLICY feedback_select_all ON public.feedback FOR SELECT USING (true);
CREATE POLICY feedback_insert_all ON public.feedback FOR INSERT WITH CHECK (true);
CREATE POLICY feedback_update_all ON public.feedback FOR UPDATE USING (true);

-- ========================================
-- HELPER FUNCTIONS
-- ========================================

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

-- ========================================
-- TABLE COMMENTS
-- ========================================

COMMENT ON TABLE public.users IS 'User accounts and profiles';
COMMENT ON TABLE public.strains IS 'Cannabis strain database (35k+ strains)';
COMMENT ON TABLE public.scans IS 'User-uploaded images scanned by Google Vision AI';
COMMENT ON TABLE public.friendships IS 'Bidirectional friend requests and accepted friendships';
COMMENT ON TABLE public.groups IS 'User groups and chat rooms';
COMMENT ON TABLE public.group_members IS 'Group membership tracking';
COMMENT ON TABLE public.messages IS 'Group chat messages';
COMMENT ON TABLE public.growers IS 'Registered growers (certified and non-certified)';
COMMENT ON TABLE public.seeds IS 'Seed bank listings and vendors';
COMMENT ON TABLE public.dispensaries IS 'Dispensary directory';
COMMENT ON TABLE public.grow_logs IS 'User grow journals and progress tracking';
COMMENT ON TABLE public.journals IS 'User private/public journals';
COMMENT ON TABLE public.events IS 'Community events and meetups';
COMMENT ON TABLE public.feedback IS 'User feedback and bug reports';

COMMENT ON FUNCTION public.are_friends IS 'Check if two users are friends (accepted status)';

-- ========================================
-- MIGRATION COMPLETE
-- ========================================
-- Next steps:
-- 1. Import strain data: Run tools/full_pipeline.mjs
-- 2. Set SUPABASE_SERVICE_ROLE_KEY in env/.env.local for storage writes
-- 3. Create 'scans' storage bucket (public) in Supabase Storage UI
-- 4. Update RLS policies for production (replace 'true' with auth.uid() checks)
-- ========================================
