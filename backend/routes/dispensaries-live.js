import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

// Blacklist of known closed dispensaries (to filter from Google Places results)
const CLOSED_DISPENSARIES = [
  'Green Springs Medical Marijuana Dispensary',
  'Green Springs Medical'
];

const CANNABIS_KEYWORDS = [
  'cannabis',
  'marijuana',
  'weed',
  'dispensary',
  'thc',
  'cbd',
  'tetrahydrocannabinol',
  'medical marijuana',
  'medical cannabis',
  'recreational cannabis',
  '420',
  'bud',
  'ganja',
  'hemp',
  'hash',
  'kief',
  'flower',
  'good day farm',
  'curaleaf',
  'trulieve',
  'zen leaf',
  'rise dispensary',
  'bloom medicinals',
  'greenlight',
  'verilife',
  'planet 13',
  'harvest cannabis',
  'green goods',
  'gtl cannabis',
  'muv dispensary'
];

const DISALLOWED_TYPES = [
  'supermarket',
  'grocery_or_supermarket',
  'department_store',
  'convenience_store',
  'big_box_store',
  'hardware_store',
  'beauty_salon',
  'hair_care',
  'home_goods_store',
  'drugstore',
  'shopping_mall',
  'clothing_store',
  'shoe_store',
  'book_store',
  'furniture_store',
  'painter',
  'pest_control',
  'lawn_mower_store',
  'landscaper'
];

const NON_CANNABIS_KEYWORDS = [
  'weed control',
  'lawn care',
  'pest control',
  'beauty',
  'ulta',
  'cosmetic',
  'salon',
  'spa',
  'nail',
  'makeup',
  'bath & body',
  'garden center',
  'nursery',
  'farm supply'
];

const PRIMARY_SEARCH_KEYWORDS = [
  { keyword: 'cannabis dispensary' },
  { keyword: 'marijuana dispensary' },
  { keyword: 'weed dispensary' },
  { keyword: 'medical marijuana dispensary', type: 'pharmacy' },
  { keyword: 'cannabis store', type: 'store' },
  { keyword: 'cbd dispensary', type: 'store' },
  { keyword: 'cbd shop', type: 'store' },
  { keyword: 'weed delivery' },
  { keyword: 'recreational dispensary' },
  { keyword: 'medical cannabis dispensary' },
  { keyword: '420 dispensary' },
  { keyword: 'cannabis shop' },
  { keyword: 'marijuana store' },
  { keyword: 'thc dispensary' },
  { keyword: 'cannabis outlet' }
];

function containsCannabisKeywords(...fields) {
  const haystack = fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return CANNABIS_KEYWORDS.some(keyword => haystack.includes(keyword));
}

function containsNonCannabisKeywords(...fields) {
  const haystack = fields
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return NON_CANNABIS_KEYWORDS.some(keyword => haystack.includes(keyword));
}

function isLikelyCannabisPlace(place, searchedWithKeyword = false) {
  if (!place) return false;
  const name = place.name || '';
  const vicinity = place.vicinity || place.address || place.formatted_address || '';
  const types = Array.isArray(place.types) ? place.types : [];

  // If we searched with a cannabis keyword and got this result, trust Google's keyword matching
  // Google Places keyword search is generally accurate, so be VERY lenient
  if (searchedWithKeyword) {
    // Only filter out obvious false positives - be extremely permissive
    const haystack = `${name} ${vicinity} ${types.join(' ')}`.toLowerCase();
    
    // Only filter if it's clearly NOT a dispensary (very strict filtering)
    const hasStrongNonCannabisIndicator = 
      containsNonCannabisKeywords(haystack) &&
      (haystack.includes('lawn') || haystack.includes('garden center') || haystack.includes('nursery') || haystack.includes('pest control'));
    
    if (hasStrongNonCannabisIndicator) {
      return false;
    }

    // Only filter obvious non-dispensary types (e.g. Walmart, Costco, grocery stores)
    // But be lenient - if Google returned it for a cannabis keyword, it's probably right
    const hasDisallowedType = types.some(type => 
      DISALLOWED_TYPES.includes(type) && 
      (type === 'supermarket' || type === 'grocery_or_supermarket' || type === 'department_store')
    );
    
    if (hasDisallowedType) {
      return false;
    }

    // If we searched with a cannabis keyword and Google returned it, trust it
    // This is very lenient because Google's keyword search is accurate
    return true;
  }

  // For results NOT from keyword search, require explicit cannabis keywords
  const hasKeyword = containsCannabisKeywords(
    name,
    vicinity,
    types.join(' ')
  );

  if (!hasKeyword) {
    return false;
  }

  const haystack = `${name} ${vicinity}`.toLowerCase();
  if (containsNonCannabisKeywords(haystack, types.join(' '))) {
    return false;
  }

  // Filter obvious non-dispensary types (e.g. Walmart, Costco)
  if (types.some(type => DISALLOWED_TYPES.includes(type))) {
    return false;
  }

  return true;
}

/**
 * Live Dispensary Finder
 * Combines database results with Google Places API for real-time dispensary search
 *
 * GET /api/dispensaries-live?lat=37.7749&lng=-122.4194&radius=10
 */

// Helper: Calculate distance between two coordinates (Haversine formula)
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Helper: generate additional search centers (offset grid) for broader coverage
function generateSearchCenters(lat, lng, radiusMiles) {
  const centers = [{ lat, lng }];
  if (radiusMiles <= 15) {
    return centers;
  }

  const mileToLat = 1 / 69; // approx
  const mileToLng = 1 / (Math.cos(lat * Math.PI / 180) * 69);
  const offsets = [
    { dLat: radiusMiles * 0.3, dLng: 0 },
    { dLat: -radiusMiles * 0.3, dLng: 0 },
    { dLat: 0, dLng: radiusMiles * 0.3 },
    { dLat: 0, dLng: -radiusMiles * 0.3 },
    { dLat: radiusMiles * 0.2, dLng: radiusMiles * 0.2 },
    { dLat: radiusMiles * 0.2, dLng: -radiusMiles * 0.2 },
    { dLat: -radiusMiles * 0.2, dLng: radiusMiles * 0.2 },
    { dLat: -radiusMiles * 0.2, dLng: -radiusMiles * 0.2 }
  ];

  offsets.forEach((offset) => {
    centers.push({
      lat: lat + offset.dLat * mileToLat,
      lng: lng + offset.dLng * mileToLng
    });
  });

  return centers;
}

// Helper: fetch with timeout so Google calls never hang forever
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeoutId);
  }
}

async function runWithConcurrency(tasks, limit = 4) {
  const results = [];
  let index = 0;

  async function worker() {
    while (index < tasks.length) {
      const currentIndex = index++;
      try {
        results[currentIndex] = await tasks[currentIndex]();
      } catch (err) {
        results[currentIndex] = { error: err };
      }
    }
  }

  const workers = Array.from({ length: Math.min(limit, tasks.length) }, () => worker());
  await Promise.all(workers);
  return results;
}

// Helper: Search Google Places Nearby for dispensaries
async function searchGooglePlaces(lat, lng, radius, overrideKeyword) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[dispensaries-live] No Google Places API key configured - Google Places search disabled');
    return [];
  }

  try {
    // Convert radius from miles to meters
    const radiusMeters = Math.min(radius * 1609.34, 50000); // Max 50km

    // Try multiple search keywords/type combinations to catch different dispensary listings
    const searchConfigs = PRIMARY_SEARCH_KEYWORDS;

    let allResults = [];
    const seenPlaceIds = new Set();

    // Search with each keyword and combine results
    // Use more keywords for better coverage - always use at least 10 keywords
    const configsToUse = overrideKeyword
      ? [{ keyword: overrideKeyword }]
      : searchConfigs.slice(0, Math.min(searchConfigs.length, radius > 30 ? 15 : radius > 15 ? 12 : 10));
    
    console.log(`[dispensaries-live] Using ${configsToUse.length} search keywords: ${configsToUse.map(c => c.keyword).join(', ')}`);
    console.log(`[dispensaries-live] Search location: ${lat}, ${lng}, radius: ${radius} miles (${radiusMeters.toFixed(0)} meters)`);

    const tasks = configsToUse.map(({ keyword, type }) => async () => {
      const typeParam = type ? `&type=${encodeURIComponent(type)}` : '';
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(keyword)}${typeParam}&key=${GOOGLE_PLACES_API_KEY}`;
      const response = await fetchWithTimeout(url);
      return response.json();
    });

    const responses = await runWithConcurrency(tasks, 3);

    for (const data of responses) {
      if (!data || data.error) {
        if (data?.error) {
          console.error('[dispensaries-live] Nearby search failed:', data.error.message || data.error);
        }
        continue;
      }

      if (data.status === 'OK' && data.results) {
        console.log(`[dispensaries-live] Google Places returned ${data.results.length} results for keyword: "${keyword}"`);
        for (const place of data.results) {
          const isClosed = place.business_status?.includes('CLOSED');
          const isBlacklisted = CLOSED_DISPENSARIES.some(closed => place.name?.includes(closed));
          // Since we searched with a cannabis keyword, trust Google's results more
          const looksLikeDispensary = isLikelyCannabisPlace(place, true);

          if (!seenPlaceIds.has(place.place_id) && !isClosed && !isBlacklisted && looksLikeDispensary) {
            seenPlaceIds.add(place.place_id);
            allResults.push(place);
            console.log(`[dispensaries-live] ✅ Added: ${place.name} (${place.vicinity || place.formatted_address})`);
          } else {
            const reasons = [];
            if (seenPlaceIds.has(place.place_id)) reasons.push('duplicate');
            if (isClosed) reasons.push('closed');
            if (isBlacklisted) reasons.push('blacklisted');
            if (!looksLikeDispensary) reasons.push('filtered');
            console.log(`[dispensaries-live] ❌ Filtered: ${place.name} (${reasons.join(', ')})`);
          }
        }
      } else if (data.status && data.status !== 'ZERO_RESULTS') {
        console.error(`[dispensaries-live] Google Places API error for "${keyword}":`, data.status, data.error_message);
      } else if (data.status === 'ZERO_RESULTS') {
        console.log(`[dispensaries-live] Zero results for keyword: "${keyword}"`);
      }
    }

    console.log(`[dispensaries-live] Found ${allResults.length} unique dispensaries from Google Places (searched ${configsToUse.length} keywords)`);

    // Transform Google Places results to our format
    return allResults.map(place => ({
      id: `google-${place.place_id}`,
      name: place.name,
      address: place.vicinity,
      city: extractCity(place.vicinity),
      state: extractState(place.vicinity),
      latitude: place.geometry.location.lat,
      longitude: place.geometry.location.lng,
      rating: place.rating || 0,
      review_count: place.user_ratings_total || 0,
      verified: false,
      source: 'google_places',
      place_id: place.place_id,
      open_now: place.opening_hours?.open_now,
      distance: haversineMiles(lat, lng, place.geometry.location.lat, place.geometry.location.lng)
    }));
  } catch (error) {
    console.error('[dispensaries-live] Google Places search failed:', error);
    return [];
  }
}

// Helper: Google Places Text Search for brand names
async function searchGooglePlacesText(query, lat, lng, radius) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_API_KEY) {
    return [];
  }

  try {
    const radiusMeters = radius ? Math.min(radius * 1609.34, 50000) : undefined;
    const locationParam = (lat && lng) ? `&location=${lat},${lng}` : '';
    const radiusParam = radiusMeters ? `&radius=${radiusMeters}` : '';
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}${locationParam}${radiusParam}&key=${GOOGLE_PLACES_API_KEY}`;
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status !== 'OK' || !data.results) {
      if (data.status !== 'ZERO_RESULTS') {
        console.error('[dispensaries-live] Places text search error:', data.status, data.error_message);
      }
      return [];
    }

    return data.results
      .filter(place => isLikelyCannabisPlace(place, true)) // Text search with keyword, so trust results
      .map(result => ({
        id: `google-text-${result.place_id}`,
        name: result.name,
        address: result.formatted_address,
        latitude: result.geometry?.location?.lat,
        longitude: result.geometry?.location?.lng,
        rating: result.rating || 0,
        review_count: result.user_ratings_total || 0,
        verified: false,
        source: 'google_places_text',
        place_id: result.place_id,
      }));
  } catch (error) {
    console.error('[dispensaries-live] Places text search failed:', error);
    return [];
  }
}

// Helper: Extract city from address string
function extractCity(address) {
  if (!address) return null;
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : null;
}

// Helper: Extract state from address string
function extractState(address) {
  if (!address) return null;
  const parts = address.split(',');
  const lastPart = parts[parts.length - 1]?.trim();
  const stateMatch = lastPart?.match(/\b([A-Z]{2})\b/);
  return stateMatch ? stateMatch[1] : null;
}

// Helper: Get dispensary details from Google Places
async function getPlaceDetails(placeId) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_API_KEY) return null;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetchWithTimeout(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      console.error('[dispensaries-live] Place details error:', data.status);
      return null;
    }

    return {
      name: data.result.name,
      address: data.result.formatted_address,
      phone: data.result.formatted_phone_number,
      website: data.result.website,
      hours: data.result.opening_hours,
      rating: data.result.rating,
      review_count: data.result.user_ratings_total,
      latitude: data.result.geometry.location.lat,
      longitude: data.result.geometry.location.lng
    };
  } catch (error) {
    console.error('[dispensaries-live] Place details failed:', error);
    return null;
  }
}

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    googlePlacesConfigured: !!process.env.GOOGLE_PLACES_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Main route: Search dispensaries
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;
    
    console.log('[dispensaries-live] Search request:', { lat, lng, radius, limit });

    if (!lat || !lng) {
      return res.status(400).json({ error: 'lat and lng parameters required' });
    }

    const userLat = parseFloat(lat);
    const userLng = parseFloat(lng);
    const searchRadius = parseFloat(radius);

    if (isNaN(userLat) || isNaN(userLng) || isNaN(searchRadius)) {
      return res.status(400).json({ error: 'Invalid lat, lng, or radius' });
    }

    // 1. Search our database for dispensaries
    let dbResults = [];
    try {
      const { data: dispensaries, error } = await supabase
        .from('dispensaries')
        .select('*')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (!error && dispensaries) {
        dbResults = dispensaries
          .filter(d => containsCannabisKeywords(d.name, d.address, d.description, Array.isArray(d.tags) ? d.tags.join(' ') : d.tags))
          .filter(d => !containsNonCannabisKeywords(d.name, d.description, d.address))
          .map(d => ({
            ...d,
            distance: haversineMiles(userLat, userLng, d.latitude, d.longitude),
            source: 'database'
          }))
          .filter(d => d.distance <= searchRadius);
      }
    } catch (dbError) {
      console.error('[dispensaries-live] Database search failed:', dbError);
    }

    // 2. Search Google Places for dispensaries across multiple centers
    const centerLimit = searchRadius <= 15 ? 1 : searchRadius <= 30 ? 2 : searchRadius <= 50 ? 3 : 4;
    const centers = generateSearchCenters(userLat, userLng, searchRadius).slice(0, centerLimit);
    console.log(`[dispensaries-live] Searching ${centers.length} center(s) with radius ${searchRadius} miles`);
    let googleResults = [];
    for (const center of centers) {
      const resultsForCenter = await searchGooglePlaces(center.lat, center.lng, searchRadius);
      console.log(`[dispensaries-live] Center (${center.lat.toFixed(4)}, ${center.lng.toFixed(4)}): found ${resultsForCenter.length} results`);
      googleResults = googleResults.concat(resultsForCenter);
      if (googleResults.length >= 80) {
        break;
      }
    }
    console.log(`[dispensaries-live] Total Google Places results: ${googleResults.length}`);

    // 2b. If Google returns very few results, run brand-focused searches for broader coverage
    let brandResults = [];
    if (googleResults.length < 10) {
      const brandKeywords = [
        'Good Day Farm dispensary',
        'Good Day Farm cannabis',
        'Curaleaf dispensary',
        'Trulieve dispensary',
        'Harvest cannabis dispensary',
        'Zen Leaf dispensary',
        'Bloom Medicinals dispensary',
        'Rise dispensary',
        'Greenlight dispensary'
      ];

      const limitedBrands = brandKeywords.slice(0, 4);
      const brandCenters = centers.slice(0, 2);

      console.log(`[dispensaries-live] Running brand search with ${limitedBrands.length} brands across ${brandCenters.length} centers`);
      for (const brand of limitedBrands) {
        for (const center of brandCenters) {
          const brandNearby = await searchGooglePlaces(center.lat, center.lng, Math.max(searchRadius, 60), brand);
          brandResults = brandResults.concat(brandNearby);

          // Text search for the brand name near the location
          const brandText = await searchGooglePlacesText(brand, center.lat, center.lng, Math.max(searchRadius, 75));
          brandResults = brandResults.concat(brandText);

          if (brandResults.length >= 40) {
            break;
          }
        }
        if (brandResults.length >= 40) {
          break;
        }
      }
      console.log(`[dispensaries-live] Brand search found ${brandResults.length} additional results`);
    }

    // Ensure brand results include distance
    brandResults = brandResults.map((item) => {
      if (typeof item.distance === 'number') return item;
      if (item.latitude !== undefined && item.longitude !== undefined) {
        return {
          ...item,
          distance: haversineMiles(userLat, userLng, item.latitude, item.longitude)
        };
      }
      return { ...item, distance: Number.POSITIVE_INFINITY };
    });

    // 3. Combine and deduplicate results
    const combined = [...googleResults, ...brandResults, ...dbResults];

    // Deduplicate by id / name+coords
    const seen = new Set();
    const deduped = [];
    for (const item of combined) {
      const key = item.id || `${item.name}-${item.address || ''}-${item.latitude || ''}-${item.longitude || ''}`;
      if (!seen.has(key)) {
        seen.add(key);
        deduped.push(item);
      }
    }

    // Sort by distance
    deduped.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limited = deduped.slice(0, parseInt(limit));

    res.json({
      total: deduped.length,
      results: limited,
      sources: {
        database: dbResults.length,
        google_places_nearby: googleResults.length,
        google_places_brand: brandResults.length
      }
    });

  } catch (error) {
    console.error('[dispensaries-live] Search failed:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Get details for a specific dispensary
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check if it's a Google Place ID
    if (id.startsWith('google-')) {
      const placeId = id.replace('google-', '');
      const details = await getPlaceDetails(placeId);
      
      if (!details) {
        return res.status(404).json({ error: 'Dispensary not found' });
      }

      return res.json({ ...details, source: 'google_places' });
    }

    // Otherwise, search database
    const { data: dispensary, error } = await supabase
      .from('dispensaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !dispensary) {
      return res.status(404).json({ error: 'Dispensary not found' });
    }

    res.json({ ...dispensary, source: 'database' });

  } catch (error) {
    console.error('[dispensaries-live] Get details failed:', error);
    res.status(500).json({ error: 'Failed to get dispensary details' });
  }
});

export default router;

