-- Add Seed Vendors and Dispensaries tables
-- Run this in Supabase SQL Editor

-- Seed Vendors
CREATE TABLE IF NOT EXISTS public.seed_vendors (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  website text,
  description text,
  logo_url text,
  location text,
  country text,
  shipping_regions text[],
  rating decimal(3,2) DEFAULT 0,
  review_count int DEFAULT 0,
  verified boolean DEFAULT false,
  payment_methods text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Seed Vendor Strains (which strains each vendor carries)
CREATE TABLE IF NOT EXISTS public.vendor_strains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id uuid REFERENCES public.seed_vendors(id) ON DELETE CASCADE,
  strain_slug text REFERENCES public.strains(slug) ON DELETE CASCADE,
  price decimal(10,2),
  currency text DEFAULT 'USD',
  seed_count int,
  in_stock boolean DEFAULT true,
  url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(vendor_id, strain_slug)
);

-- Dispensaries
CREATE TABLE IF NOT EXISTS public.dispensaries (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  city text,
  state text,
  country text DEFAULT 'USA',
  zip_code text,
  latitude decimal(10,8),
  longitude decimal(11,8),
  phone text,
  website text,
  description text,
  logo_url text,
  rating decimal(3,2) DEFAULT 0,
  review_count int DEFAULT 0,
  verified boolean DEFAULT false,
  license_number text,
  hours jsonb,
  amenities text[],
  delivery_available boolean DEFAULT false,
  medical_only boolean DEFAULT false,
  recreational_available boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Dispensary Strains (which strains each dispensary carries)
CREATE TABLE IF NOT EXISTS public.dispensary_strains (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dispensary_id uuid REFERENCES public.dispensaries(id) ON DELETE CASCADE,
  strain_slug text REFERENCES public.strains(slug) ON DELETE CASCADE,
  price_per_gram decimal(10,2),
  price_per_eighth decimal(10,2),
  price_per_quarter decimal(10,2),
  price_per_half decimal(10,2),
  price_per_ounce decimal(10,2),
  in_stock boolean DEFAULT true,
  last_updated timestamptz DEFAULT now(),
  UNIQUE(dispensary_id, strain_slug)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_seed_vendors_country ON public.seed_vendors(country);
CREATE INDEX IF NOT EXISTS idx_seed_vendors_verified ON public.seed_vendors(verified);
CREATE INDEX IF NOT EXISTS idx_vendor_strains_vendor ON public.vendor_strains(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_strains_strain ON public.vendor_strains(strain_slug);
CREATE INDEX IF NOT EXISTS idx_vendor_strains_in_stock ON public.vendor_strains(in_stock);

CREATE INDEX IF NOT EXISTS idx_dispensaries_location ON public.dispensaries(city, state);
CREATE INDEX IF NOT EXISTS idx_dispensaries_coords ON public.dispensaries(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_dispensaries_verified ON public.dispensaries(verified);
CREATE INDEX IF NOT EXISTS idx_dispensary_strains_dispensary ON public.dispensary_strains(dispensary_id);
CREATE INDEX IF NOT EXISTS idx_dispensary_strains_strain ON public.dispensary_strains(strain_slug);
CREATE INDEX IF NOT EXISTS idx_dispensary_strains_in_stock ON public.dispensary_strains(in_stock);

-- RLS Policies (read-only for now, admin can manage via service role)
ALTER TABLE public.seed_vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_strains ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dispensary_strains ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read
CREATE POLICY seed_vendors_select ON public.seed_vendors FOR SELECT USING (true);
CREATE POLICY vendor_strains_select ON public.vendor_strains FOR SELECT USING (true);
CREATE POLICY dispensaries_select ON public.dispensaries FOR SELECT USING (true);
CREATE POLICY dispensary_strains_select ON public.dispensary_strains FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE public.seed_vendors IS 'Seed vendors and breeders';
COMMENT ON TABLE public.vendor_strains IS 'Strains available from each vendor with pricing';
COMMENT ON TABLE public.dispensaries IS 'Dispensaries with location data';
COMMENT ON TABLE public.dispensary_strains IS 'Strains available at each dispensary with pricing';

-- Force PostgREST to reload schema
NOTIFY pgrst, 'reload schema';

