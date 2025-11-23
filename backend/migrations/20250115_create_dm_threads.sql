-- Migration: Create dm_threads for 1:1 messaging

CREATE TABLE IF NOT EXISTS public.dm_threads (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enforce uniqueness of the pair (we will always write sorted order)
CREATE UNIQUE INDEX IF NOT EXISTS idx_dm_threads_pair
ON public.dm_threads (user_a, user_b);

-- Indexes for listing threads for a user
CREATE INDEX IF NOT EXISTS idx_dm_threads_user_a
ON public.dm_threads (user_a, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_dm_threads_user_b
ON public.dm_threads (user_b, updated_at DESC);

COMMENT ON TABLE public.dm_threads IS
'1:1 DM threads between two users (user_a, user_b), stored in canonical sorted order';

