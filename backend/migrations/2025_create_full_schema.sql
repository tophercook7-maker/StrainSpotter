-- StrainSpotter Full Schema Migration (PostgreSQL/Supabase)

-- Required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Users
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  username text UNIQUE,
  email text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
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
  matched_strain_slug text REFERENCES public.strains(slug) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  plant_age text,
  plant_health jsonb,
  grow_log_id uuid REFERENCES public.grow_logs(id) ON DELETE SET NULL
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

-- Basic RLS enable + permissive dev policies (adjust for prod)
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY scans_select_all ON public.scans FOR SELECT USING (true);
CREATE POLICY scans_insert_all ON public.scans FOR INSERT WITH CHECK (true);
CREATE POLICY scans_update_all ON public.scans FOR UPDATE USING (true);

ALTER TABLE public.grow_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY growlogs_select_all ON public.grow_logs FOR SELECT USING (true);
CREATE POLICY growlogs_insert_all ON public.grow_logs FOR INSERT WITH CHECK (true);
CREATE POLICY growlogs_update_all ON public.grow_logs FOR UPDATE USING (true);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY groups_select_all ON public.groups FOR SELECT USING (true);
CREATE POLICY groups_insert_all ON public.groups FOR INSERT WITH CHECK (true);
CREATE POLICY groups_update_all ON public.groups FOR UPDATE USING (true);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY group_members_select_all ON public.group_members FOR SELECT USING (true);
CREATE POLICY group_members_insert_all ON public.group_members FOR INSERT WITH CHECK (true);
CREATE POLICY group_members_update_all ON public.group_members FOR UPDATE USING (true);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_select_all ON public.messages FOR SELECT USING (true);
CREATE POLICY messages_insert_all ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY messages_update_all ON public.messages FOR UPDATE USING (true);

ALTER TABLE public.growers ENABLE ROW LEVEL SECURITY;
CREATE POLICY growers_select_all ON public.growers FOR SELECT USING (true);
CREATE POLICY growers_insert_all ON public.growers FOR INSERT WITH CHECK (true);
CREATE POLICY growers_update_all ON public.growers FOR UPDATE USING (true);

ALTER TABLE public.journals ENABLE ROW LEVEL SECURITY;
CREATE POLICY journals_select_all ON public.journals FOR SELECT USING (true);
CREATE POLICY journals_insert_all ON public.journals FOR INSERT WITH CHECK (true);
CREATE POLICY journals_update_all ON public.journals FOR UPDATE USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY events_select_all ON public.events FOR SELECT USING (true);
CREATE POLICY events_insert_all ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY events_update_all ON public.events FOR UPDATE USING (true);
