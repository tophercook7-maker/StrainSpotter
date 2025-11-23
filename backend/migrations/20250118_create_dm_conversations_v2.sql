-- Create dedicated DM conversations table (simpler than conversations table)
CREATE TABLE IF NOT EXISTS public.dm_conversations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    participant_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participant_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_preview text,
    last_message_at timestamptz,
    last_message_sender uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    is_archived_a boolean DEFAULT false,
    is_archived_b boolean DEFAULT false,
    
    -- Ensure participant_a < participant_b for canonical ordering
    CONSTRAINT dm_conversations_participant_order CHECK (participant_a < participant_b),
    -- Ensure unique pair
    UNIQUE (participant_a, participant_b)
);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_a_updated
ON public.dm_conversations (participant_a, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_participant_b_updated
ON public.dm_conversations (participant_b, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_conversations_last_message_at
ON public.dm_conversations (last_message_at DESC);

COMMENT ON TABLE public.dm_conversations IS '1:1 DM conversations between two users';
COMMENT ON COLUMN public.dm_conversations.participant_a IS 'Canonically ordered: always the smaller UUID';
COMMENT ON COLUMN public.dm_conversations.participant_b IS 'Canonically ordered: always the larger UUID';

