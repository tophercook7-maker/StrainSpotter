-- Users table (if not using Supabase Auth users)
CREATE TABLE IF NOT EXISTS public.users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Threads (DM or group)
CREATE TABLE IF NOT EXISTS public.threads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text DEFAULT 'dm', -- 'dm' or 'group'
  name text,
  created_at timestamptz DEFAULT now()
);

-- Thread members
CREATE TABLE IF NOT EXISTS public.thread_members (
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (thread_id, user_id)
);

-- Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text,
  type text DEFAULT 'text', -- 'text', 'image', etc.
  created_at timestamptz DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS messages_thread_id_created_at_idx ON public.messages (thread_id, created_at DESC);
