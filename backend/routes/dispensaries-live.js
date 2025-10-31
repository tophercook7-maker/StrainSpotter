import express from 'express';
import { supabase } from '../supabaseClient.js';
const router = express.Router();

/**
 * Live Dispensary Finder
 * Combines database results with Google Places API for real-time dispensary search
 * 
 * GET /api/dispensaries-live?lat=37.7749&lng=-122.4194&radius=10&strain=blue-dream
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

// Helper: Search Google Places for dispensaries
async function searchGooglePlaces(lat, lng, radius) {
  const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;
  
  if (!GOOGLE_PLACES_API_KEY) {
    console.warn('[dispensaries-live] No Google Places API key configured');
    return [];
  }

  try {
    // Convert radius from miles to meters
    const radiusMeters = Math.min(radius * 1609.34, 50000); // Max 50km

    // Try multiple search keywords to catch different dispensary types
    const keywords = [
      'cannabis dispensary',
      'marijuana dispensary',
      'medical marijuana',
      'cannabis pharmacy'
    ];

    let allResults = [];
    const seenPlaceIds = new Set();

    // Search with each keyword and combine results
    for (const keyword of keywords) {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_PLACES_API_KEY}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        // Add unique results only
        for (const place of data.results) {
          if (!seenPlaceIds.has(place.place_id)) {
            seenPlaceIds.add(place.place_id);
            allResults.push(place);
          }
        }
      } else if (data.status !== 'ZERO_RESULTS') {
        console.error('[dispensaries-live] Google Places API error:', data.status, data.error_message);
      }
    }

    console.log(`[dispensaries-live] Found ${allResults.length} unique dispensaries from Google Places`);

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
    
    const response = await fetch(url);
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

// Main route: Search dispensaries
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius = 10, strain, limit = 20 } = req.query;

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
        dbResults = dispensaries.map(d => ({
          ...d,
          distance: haversineMiles(userLat, userLng, d.latitude, d.longitude),
          source: 'database'
        })).filter(d => d.distance <= searchRadius);
      }
    } catch (dbError) {
      console.error('[dispensaries-live] Database search failed:', dbError);
    }

    // 2. Search Google Places for dispensaries
    const googleResults = await searchGooglePlaces(userLat, userLng, searchRadius);

    // 3. If strain is specified, filter database results
    if (strain) {
      try {
        const { data: strainDispensaries, error } = await supabase
          .from('dispensary_strains')
          .select('dispensary_id, dispensaries(*)')
          .eq('strain_slug', strain)
          .eq('in_stock', true);

        if (!error && strainDispensaries) {
          const strainDispIds = new Set(strainDispensaries.map(sd => sd.dispensary_id));
          dbResults = dbResults.filter(d => strainDispIds.has(d.id));
        }
      } catch (strainError) {
        console.error('[dispensaries-live] Strain filter failed:', strainError);
      }
    }

    // 4. Combine and deduplicate results
    const combined = [...dbResults, ...googleResults];
    
    // Sort by distance
    combined.sort((a, b) => a.distance - b.distance);

    // Limit results
    const limited = combined.slice(0, parseInt(limit));

    res.json({
      total: combined.length,
      results: limited,
      sources: {
        database: dbResults.length,
        google_places: googleResults.length
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

