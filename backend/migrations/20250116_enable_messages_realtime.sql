-- Migration: Enable Supabase Realtime for messages table
-- This allows clients to subscribe to live message updates

-- Enable replica identity for realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Note: The publication 'supabase_realtime' is typically created automatically by Supabase
-- If it doesn't exist, you may need to create it manually:
-- CREATE PUBLICATION supabase_realtime FOR TABLE public.messages;

COMMENT ON TABLE public.messages IS 'Messages table with realtime enabled for live chat updates';

