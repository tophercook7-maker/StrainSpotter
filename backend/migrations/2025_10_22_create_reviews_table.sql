-- Reviews table for strain feedback
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
  strain_slug text REFERENCES public.strains(slug) ON DELETE CASCADE,
  rating int CHECK (rating BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reviews_strain ON public.reviews(strain_slug);
CREATE INDEX IF NOT EXISTS idx_reviews_user ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

-- RLS (permissive for dev)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY reviews_select_all ON public.reviews FOR SELECT USING (true);
CREATE POLICY reviews_insert_all ON public.reviews FOR INSERT WITH CHECK (true);
CREATE POLICY reviews_update_own ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY reviews_delete_own ON public.reviews FOR DELETE USING (auth.uid() = user_id);

COMMENT ON TABLE public.reviews IS 'User reviews and ratings for strains';
