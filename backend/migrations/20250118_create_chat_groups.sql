-- Migration: Create chat_groups table for ZIP-based and global group chats
-- This is separate from conversations table - chat_groups are for public/community groups

CREATE TABLE IF NOT EXISTS public.chat_groups (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- e.g. 'zip', 'global', 'interest'
    group_type text NOT NULL CHECK (group_type IN ('zip','global','interest')),
    
    -- for zip groups: '72201'
    zip_code text,
    
    -- display name: e.g. 'Little Rock 72201', 'National Growers', 'All Dispensaries'
    name text NOT NULL,
    
    -- optional description
    description text,
    
    -- optional: restrict posting to businesses only
    business_only boolean DEFAULT false,
    
    -- if true, visible to all; if false, might be invite-only later
    is_public boolean DEFAULT true,
    
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_groups_group_type
ON public.chat_groups (group_type);

CREATE INDEX IF NOT EXISTS idx_chat_groups_zip_code
ON public.chat_groups (zip_code);

CREATE INDEX IF NOT EXISTS idx_chat_groups_is_public
ON public.chat_groups (is_public);

CREATE UNIQUE INDEX IF NOT EXISTS idx_chat_groups_zip_unique
ON public.chat_groups (zip_code)
WHERE zip_code IS NOT NULL AND group_type = 'zip';

COMMENT ON TABLE public.chat_groups IS 'Public group chats: ZIP-based, global, and interest-based communities';
COMMENT ON COLUMN public.chat_groups.group_type IS 'Type of group: zip (local), global (system-wide), interest (topic-based)';
COMMENT ON COLUMN public.chat_groups.zip_code IS 'ZIP code for zip-type groups (unique per ZIP)';
COMMENT ON COLUMN public.chat_groups.business_only IS 'If true, only businesses can post (users can still read)';
COMMENT ON COLUMN public.chat_groups.is_public IS 'If true, visible to all users; if false, invite-only';

