-- Migration: Create dm_messages for 1:1 messaging

CREATE TABLE IF NOT EXISTS public.dm_messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id uuid NOT NULL REFERENCES public.dm_threads(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body text,
    image_url text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_dm_messages_thread_created
ON public.dm_messages (thread_id, created_at DESC);

COMMENT ON TABLE public.dm_messages IS
'Messages inside a dm_thread, supports text + optional image URL';

