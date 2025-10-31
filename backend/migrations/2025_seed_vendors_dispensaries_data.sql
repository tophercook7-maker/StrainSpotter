-- Sample Seed Vendors and Dispensaries Data
-- Run this AFTER running 2025_add_vendors_dispensaries.sql

-- Insert Sample Seed Vendors
INSERT INTO public.seed_vendors (name, website, description, country, shipping_regions, rating, review_count, verified, payment_methods) VALUES
('Seedsman', 'https://www.seedsman.com', 'One of the oldest and most trusted seed banks with over 4,000 strains', 'UK', ARRAY['USA', 'Canada', 'Europe', 'Australia'], 4.5, 12500, true, ARRAY['Credit Card', 'Bitcoin', 'Bank Transfer']),
('ILGM', 'https://ilgm.com', 'I Love Growing Marijuana - Premium seeds with germination guarantee', 'Netherlands', ARRAY['USA', 'Canada', 'Europe'], 4.7, 8900, true, ARRAY['Credit Card', 'Bitcoin']),
('Crop King Seeds', 'https://www.cropkingseeds.com', 'Canadian seed bank with fast shipping and great customer service', 'Canada', ARRAY['USA', 'Canada'], 4.6, 5600, true, ARRAY['Credit Card', 'E-Transfer']),
('Barney''s Farm', 'https://www.barneysfarm.com', 'Award-winning Amsterdam-based breeder since 1980', 'Netherlands', ARRAY['Europe', 'USA', 'Canada'], 4.8, 15000, true, ARRAY['Credit Card', 'Bitcoin']),
('Sensi Seeds', 'https://sensiseeds.com', 'Legendary seed bank preserving original genetics since 1985', 'Netherlands', ARRAY['Europe', 'USA', 'Canada', 'Australia'], 4.7, 11200, true, ARRAY['Credit Card', 'Bitcoin', 'Bank Transfer']),
('Nirvana Seeds', 'https://www.nirvana-seeds.com', 'Affordable quality seeds from Amsterdam', 'Netherlands', ARRAY['Worldwide'], 4.4, 6800, true, ARRAY['Credit Card', 'Bitcoin']),
('DNA Genetics', 'https://dnagenetics.com', 'Award-winning breeders of premium cannabis genetics', 'USA', ARRAY['USA', 'Europe'], 4.9, 4200, true, ARRAY['Credit Card', 'Cash']),
('Humboldt Seed Company', 'https://humboldtseedcompany.com', 'California-based breeders with unique West Coast genetics', 'USA', ARRAY['USA'], 4.8, 3500, true, ARRAY['Credit Card', 'Debit Card'])
ON CONFLICT DO NOTHING;

-- Insert Sample Dispensaries (California examples)
INSERT INTO public.dispensaries (name, address, city, state, country, zip_code, latitude, longitude, phone, website, description, rating, review_count, verified, delivery_available, medical_only, recreational_available) VALUES
('MedMen West Hollywood', '8208 Santa Monica Blvd', 'West Hollywood', 'CA', 'USA', '90046', 34.0900, -118.3700, '(323) 848-6633', 'https://medmen.com', 'Premium cannabis retailer with modern design and expert staff', 4.5, 2800, true, true, false, true),
('The Pottery', '6300 Santa Monica Blvd', 'Los Angeles', 'CA', 'USA', '90038', 34.0900, -118.3200, '(323) 466-8880', 'https://thepottery.com', 'Upscale dispensary with curated selection and knowledgeable budtenders', 4.7, 1900, true, true, false, true),
('Cookies Melrose', '8360 Melrose Ave', 'Los Angeles', 'CA', 'USA', '90069', 34.0838, -118.3700, '(323) 944-2121', 'https://cookies.co', 'Berner''s flagship store with exclusive Cookies genetics', 4.8, 5600, true, false, false, true),
('Harborside Oakland', '1840 Embarcadero', 'Oakland', 'CA', 'USA', '94606', 37.7900, -122.2700, '(510) 777-1111', 'https://harborside.com', 'One of the oldest and largest dispensaries in California', 4.6, 8900, true, true, false, true),
('SPARC SF', '473 Haight St', 'San Francisco', 'CA', 'USA', '94117', 37.7720, -122.4310, '(415) 621-7272', 'https://sparcsf.org', 'Community-focused dispensary in the heart of Haight-Ashbury', 4.5, 3200, true, true, true, true),
('Jungle Boys', '5700 Melrose Ave', 'Los Angeles', 'CA', 'USA', '90038', 34.0838, -118.3100, '(323) 380-3113', 'https://jungleboys.com', 'Legendary growers with top-shelf indoor flower', 4.9, 12000, true, false, false, true),
('The Green Cross', '9210 Culver Blvd', 'Culver City', 'CA', 'USA', '90232', 34.0100, -118.3900, '(310) 838-9333', 'https://thegreencross.org', 'Medical-focused dispensary with compassionate care', 4.4, 1500, true, true, true, false),
('Urbn Leaf', '2229 El Cajon Blvd', 'San Diego', 'CA', 'USA', '92104', 32.7500, -117.1400, '(619) 381-1234', 'https://urbnleaf.com', 'Modern dispensary chain with consistent quality', 4.6, 4200, true, true, false, true)
ON CONFLICT DO NOTHING;

-- Link some strains to vendors (you'll need to adjust strain_slug values based on your actual strains)
-- Example: Linking popular strains to vendors
INSERT INTO public.vendor_strains (vendor_id, strain_slug, price, seed_count, in_stock, url) 
SELECT 
  sv.id,
  'blue-dream',
  49.99,
  5,
  true,
  sv.website || '/blue-dream'
FROM public.seed_vendors sv
WHERE sv.name IN ('Seedsman', 'ILGM', 'Barney''s Farm')
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_strains (vendor_id, strain_slug, price, seed_count, in_stock, url) 
SELECT 
  sv.id,
  'og-kush',
  59.99,
  5,
  true,
  sv.website || '/og-kush'
FROM public.seed_vendors sv
WHERE sv.name IN ('DNA Genetics', 'Sensi Seeds', 'Crop King Seeds')
ON CONFLICT DO NOTHING;

INSERT INTO public.vendor_strains (vendor_id, strain_slug, price, seed_count, in_stock, url) 
SELECT 
  sv.id,
  'girl-scout-cookies',
  69.99,
  5,
  true,
  sv.website || '/girl-scout-cookies'
FROM public.seed_vendors sv
WHERE sv.name IN ('Seedsman', 'DNA Genetics', 'Humboldt Seed Company')
ON CONFLICT DO NOTHING;

-- Link some strains to dispensaries
INSERT INTO public.dispensary_strains (dispensary_id, strain_slug, price_per_gram, price_per_eighth, price_per_quarter, price_per_half, price_per_ounce, in_stock)
SELECT 
  d.id,
  'blue-dream',
  12.00,
  40.00,
  75.00,
  140.00,
  260.00,
  true
FROM public.dispensaries d
WHERE d.name IN ('MedMen West Hollywood', 'The Pottery', 'Harborside Oakland')
ON CONFLICT DO NOTHING;

INSERT INTO public.dispensary_strains (dispensary_id, strain_slug, price_per_gram, price_per_eighth, price_per_quarter, price_per_half, price_per_ounce, in_stock)
SELECT 
  d.id,
  'og-kush',
  15.00,
  50.00,
  90.00,
  170.00,
  320.00,
  true
FROM public.dispensaries d
WHERE d.name IN ('Cookies Melrose', 'Jungle Boys', 'SPARC SF')
ON CONFLICT DO NOTHING;

INSERT INTO public.dispensary_strains (dispensary_id, strain_slug, price_per_gram, price_per_eighth, price_per_quarter, price_per_half, price_per_ounce, in_stock)
SELECT 
  d.id,
  'girl-scout-cookies',
  14.00,
  45.00,
  85.00,
  160.00,
  300.00,
  true
FROM public.dispensaries d
WHERE d.name IN ('Cookies Melrose', 'Jungle Boys', 'The Pottery', 'Urbn Leaf')
ON CONFLICT DO NOTHING;

