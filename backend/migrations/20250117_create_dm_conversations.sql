-- Migration: Create DM conversations table for 1:1 messaging
-- This is separate from the group conversations table (conversations) from PART 9
-- DMs are simpler: user-user or user-business pairs

CREATE TABLE IF NOT EXISTS public.dm_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- participant A (always a user)
    user_a_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- participant B can be:
    --   - a user (user_b_id)
    --   - a business (business_b_id)
    user_b_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    business_b_id uuid REFERENCES public.business_profiles(id) ON DELETE CASCADE,
    
    -- meta
    last_message_text text,
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    
    -- ensure we don't have duplicates:
    CONSTRAINT dm_conversations_participants_check
      CHECK ((user_b_id IS NOT NULL) OR (business_b_id IS NOT NULL))
);

-- Indexes for participant lookup
CREATE INDEX IF NOT EXISTS idx_dm_conversations_user_a_id
ON public.dm_conversations (user_a_id);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_user_b_id
ON public.dm_conversations (user_b_id);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_business_b_id
ON public.dm_conversations (business_b_id);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message_at
ON public.dm_conversations (last_message_at DESC);

-- Unique constraint to prevent duplicate conversations
-- We'll enforce this in application logic by always storing user_a_id < user_b_id
-- For business conversations, we'll use a canonical ordering

COMMENT ON TABLE public.dm_conversations IS '1:1 direct message conversations between users or user-business';
COMMENT ON COLUMN public.dm_conversations.user_a_id IS 'First participant (always a user)';
COMMENT ON COLUMN public.dm_conversations.user_b_id IS 'Second participant (user, if user-user DM)';
COMMENT ON COLUMN public.dm_conversations.business_b_id IS 'Second participant (business, if user-business DM)';
COMMENT ON COLUMN public.dm_conversations.last_message_text IS 'Preview of last message for inbox';
COMMENT ON COLUMN public.dm_conversations.last_message_at IS 'Timestamp of last message for sorting';

