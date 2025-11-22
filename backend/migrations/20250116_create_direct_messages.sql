-- Migration: Create direct messaging system tables (thread-based)
-- Enables user-to-user, grower-to-user, and dispensary-to-user messaging
-- Extends existing direct_messages table with thread support

-- Direct message threads (one per user pair)
CREATE TABLE IF NOT EXISTS public.direct_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at timestamptz,
    created_at timestamptz DEFAULT now(),
    UNIQUE (user_a, user_b)
);

-- Add thread support to existing direct_messages table
-- The table already exists with sender_id/receiver_id/content columns
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'direct_messages'
    ) THEN
        -- Add thread_id and image support columns
        ALTER TABLE public.direct_messages
        ADD COLUMN IF NOT EXISTS thread_id uuid REFERENCES public.direct_threads(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS image_url text,
        ADD COLUMN IF NOT EXISTS image_width integer,
        ADD COLUMN IF NOT EXISTS image_height integer,
        ADD COLUMN IF NOT EXISTS message text; -- Alias for content
        
        -- Create index for thread lookups
        CREATE INDEX IF NOT EXISTS idx_direct_messages_thread
        ON public.direct_messages (thread_id, created_at DESC);
    END IF;
END $$;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_direct_threads_user_a
ON public.direct_threads (user_a);

CREATE INDEX IF NOT EXISTS idx_direct_threads_user_b
ON public.direct_threads (user_b);

CREATE INDEX IF NOT EXISTS idx_direct_threads_last_message
ON public.direct_threads (last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_thread
ON public.direct_messages (thread_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_direct_messages_sender
ON public.direct_messages (sender);

CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver
ON public.direct_messages (receiver);

CREATE INDEX IF NOT EXISTS idx_direct_messages_read_at
ON public.direct_messages (receiver, read_at);

COMMENT ON TABLE public.direct_threads IS 'Message threads between two users. One thread per user pair.';
COMMENT ON TABLE public.direct_messages IS 'Individual messages in direct message threads. Supports text and image attachments.';

