begin;

-- Add pinned fields to messages table
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS pinned_at timestamptz,
  ADD COLUMN IF NOT EXISTS pinned_by uuid REFERENCES public.profiles(user_id);

-- Ensure profiles table has role column (should already exist from 20251114_profile_roles.sql)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role text DEFAULT 'consumer';

-- Create index for pinned messages queries
CREATE INDEX IF NOT EXISTS messages_pinned_at_idx ON public.messages(pinned_at) WHERE pinned_at IS NOT NULL;

commit;

