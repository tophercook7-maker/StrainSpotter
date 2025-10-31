import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

/**
 * Live Seed Vendor Finder
 * Combines database results with Google Custom Search API for real-time seed vendor search
 * 
 * GET /api/seeds-live?strain=blue-dream&country=USA&limit=20
 */

// Popular seed banks (fallback data)
const POPULAR_SEED_BANKS = [
  {
    name: 'Seedsman',
    website: 'https://www.seedsman.com',
    description: 'One of the oldest and most trusted seed banks with worldwide shipping',
    country: 'Spain',
    shipping_regions: ['Worldwide'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Bank Transfer'],
    verified: true
  },
  {
    name: 'ILGM (I Love Growing Marijuana)',
    website: 'https://ilgm.com',
    description: 'Premium cannabis seeds with germination guarantee',
    country: 'Netherlands',
    shipping_regions: ['USA', 'Canada', 'Europe', 'Australia'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Cash'],
    verified: true
  },
  {
    name: 'Crop King Seeds',
    website: 'https://www.cropkingseeds.com',
    description: 'Canadian seed bank with fast shipping to USA',
    country: 'Canada',
    shipping_regions: ['USA', 'Canada'],
    payment_methods: ['Credit Card', 'E-Transfer', 'Bitcoin'],
    verified: true
  },
  {
    name: 'MSNL (Marijuana Seeds NL)',
    website: 'https://www.msnl.com',
    description: 'Established seed bank since 1999 with stealth shipping',
    country: 'Netherlands',
    shipping_regions: ['Worldwide'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Bank Transfer'],
    verified: true
  },
  {
    name: 'Homegrown Cannabis Co',
    website: 'https://homegrowncannabisco.com',
    description: 'USA-based seed bank with expert growing advice',
    country: 'USA',
    shipping_regions: ['USA', 'Canada'],
    payment_methods: ['Credit Card', 'Bitcoin'],
    verified: true
  },
  {
    name: 'Barney\'s Farm',
    website: 'https://www.barneysfarm.com',
    description: 'Award-winning Dutch seed bank since 1980',
    country: 'Netherlands',
    shipping_regions: ['Worldwide'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Bank Transfer'],
    verified: true
  },
  {
    name: 'Dutch Passion',
    website: 'https://dutch-passion.com',
    description: 'Premium Dutch genetics since 1987',
    country: 'Netherlands',
    shipping_regions: ['Worldwide'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Bank Transfer'],
    verified: true
  },
  {
    name: 'Sensi Seeds',
    website: 'https://sensiseeds.com',
    description: 'Legendary seed bank with classic strains',
    country: 'Netherlands',
    shipping_regions: ['Worldwide'],
    payment_methods: ['Credit Card', 'Bitcoin', 'Bank Transfer'],
    verified: true
  }
];

// Helper: Search Google Custom Search for seed vendors
async function searchGoogleForSeeds(strainName) {
  const GOOGLE_SEARCH_API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
  const GOOGLE_SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;
  
  if (!GOOGLE_SEARCH_API_KEY || !GOOGLE_SEARCH_ENGINE_ID) {
    console.warn('[seeds-live] No Google Custom Search API configured');
    return [];
  }

  try {
    const query = `${strainName} cannabis seeds buy`;
    const url = `https://www.googleapis.com/customsearch/v1?key=${GOOGLE_SEARCH_API_KEY}&cx=${GOOGLE_SEARCH_ENGINE_ID}&q=${encodeURIComponent(query)}&num=10`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (!data.items) {
      return [];
    }

    // Extract seed vendor info from search results
    return data.items.map((item, index) => ({
      id: `google-search-${index}`,
      name: extractVendorName(item.title),
      website: item.link,
      description: item.snippet,
      source: 'google_search',
      verified: false,
      rating: 0,
      review_count: 0
    }));

  } catch (error) {
    console.error('[seeds-live] Google search failed:', error);
    return [];
  }
}

// Helper: Extract vendor name from search result title
function extractVendorName(title) {
  // Remove common suffixes
  return title
    .replace(/\s*-\s*Buy.*$/i, '')
    .replace(/\s*\|.*$/i, '')
    .replace(/\s*Cannabis Seeds.*$/i, '')
    .replace(/\s*Marijuana Seeds.*$/i, '')
    .trim();
}

// Helper: Search database for seed vendors
async function searchDatabaseVendors(strainSlug) {
  try {
    let query = supabase.from('seed_vendors').select('*');

    // If strain specified, join with vendor_strains
    if (strainSlug) {
      const { data: vendorStrains, error } = await supabase
        .from('vendor_strains')
        .select('vendor_id, seed_vendors(*), price, currency, seed_count, in_stock, url')
        .eq('strain_slug', strainSlug)
        .eq('in_stock', true);

      if (error) throw error;

      return (vendorStrains || []).map(vs => ({
        ...vs.seed_vendors,
        price: vs.price,
        currency: vs.currency,
        seed_count: vs.seed_count,
        in_stock: vs.in_stock,
        product_url: vs.url,
        source: 'database'
      }));
    }

    // Otherwise return all vendors
    const { data: vendors, error } = await query;
    if (error) throw error;

    return (vendors || []).map(v => ({ ...v, source: 'database' }));

  } catch (error) {
    console.error('[seeds-live] Database search failed:', error);
    return [];
  }
}

// Main route: Search seed vendors
router.get('/', async (req, res) => {
  try {
    const { strain, country, limit = 20, include_google = 'true' } = req.query;

    let results = [];

    // 1. Search database
    const dbResults = await searchDatabaseVendors(strain);
    results.push(...dbResults);

    // 2. If no database results or include_google is true, search Google
    if (include_google === 'true' && strain) {
      const googleResults = await searchGoogleForSeeds(strain);
      results.push(...googleResults);
    }

    // 3. If still no results, return popular seed banks
    if (results.length === 0) {
      results = POPULAR_SEED_BANKS.map((bank, index) => ({
        id: `popular-${index}`,
        ...bank,
        source: 'popular'
      }));
    }

    // 4. Filter by country if specified
    if (country) {
      results = results.filter(r => 
        r.country?.toLowerCase() === country.toLowerCase() ||
        r.shipping_regions?.some(region => 
          region.toLowerCase() === country.toLowerCase() || 
          region.toLowerCase() === 'worldwide'
        )
      );
    }

    // 5. Sort by verified status and rating
    results.sort((a, b) => {
      if (a.verified !== b.verified) return b.verified ? 1 : -1;
      return (b.rating || 0) - (a.rating || 0);
    });

    // 6. Limit results
    const limited = results.slice(0, parseInt(limit));

    res.json({
      total: results.length,
      results: limited,
      sources: {
        database: dbResults.length,
        google_search: results.filter(r => r.source === 'google_search').length,
        popular: results.filter(r => r.source === 'popular').length
      }
    });

  } catch (error) {
    console.error('[seeds-live] Search failed:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Get popular seed banks
router.get('/popular', (req, res) => {
  res.json({
    total: POPULAR_SEED_BANKS.length,
    results: POPULAR_SEED_BANKS.map((bank, index) => ({
      id: `popular-${index}`,
      ...bank,
      source: 'popular'
    }))
  });
});

// Get details for a specific vendor
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a popular seed bank
    if (id.startsWith('popular-')) {
      const index = parseInt(id.replace('popular-', ''));
      const bank = POPULAR_SEED_BANKS[index];
      
      if (!bank) {
        return res.status(404).json({ error: 'Vendor not found' });
      }

      return res.json({ id, ...bank, source: 'popular' });
    }

    // Otherwise, search database
    const { data: vendor, error } = await supabase
      .from('seed_vendors')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    res.json({ ...vendor, source: 'database' });

  } catch (error) {
    console.error('[seeds-live] Get details failed:', error);
    res.status(500).json({ error: 'Failed to get vendor details' });
  }
});

export default router;

