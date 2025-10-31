-- Enable RLS and permissive policies for messages table
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_insert_all ON public.messages FOR INSERT WITH CHECK (true);
CREATE POLICY messages_select_all ON public.messages FOR SELECT USING (true);
CREATE POLICY messages_update_all ON public.messages FOR UPDATE USING (true);
CREATE POLICY messages_delete_all ON public.messages FOR DELETE USING (true);
