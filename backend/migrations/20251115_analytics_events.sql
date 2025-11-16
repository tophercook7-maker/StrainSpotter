-- Analytics events logging table
CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name text NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  session_id text,
  platform text,
  context jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Allow nothing by default; service role inserts via backend
CREATE POLICY analytics_events_insert_admin
  ON public.analytics_events
  FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY analytics_events_select_admin
  ON public.analytics_events
  FOR SELECT
  TO service_role
  USING (true);

