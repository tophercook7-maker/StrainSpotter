-- 20250117_create_chat_typing.sql
-- Table for tracking typing indicators in group chats and DMs

CREATE TABLE IF NOT EXISTS public.chat_typing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scope text NOT NULL CHECK (scope IN ('group','dm')),
  channel_id uuid NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_typed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(scope, channel_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_chat_typing_channel
  ON public.chat_typing (scope, channel_id, last_typed_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_typing_user
  ON public.chat_typing (user_id);

COMMENT ON TABLE public.chat_typing IS 'Ephemeral typing indicators for group chats and DMs';
COMMENT ON COLUMN public.chat_typing.scope IS 'group or dm';
COMMENT ON COLUMN public.chat_typing.channel_id IS 'group_id for groups, conversation_id for DMs';
COMMENT ON COLUMN public.chat_typing.last_typed_at IS 'Updated when user types; entries older than 7s are considered stale';

