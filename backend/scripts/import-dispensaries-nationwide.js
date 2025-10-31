#!/usr/bin/env node

/**
 * Import Dispensaries Nationwide
 * 
 * This script searches Google Places API for cannabis dispensaries across
 * all major US cities and imports them into the Supabase database.
 * 
 * Usage:
 *   node backend/scripts/import-dispensaries-nationwide.js
 * 
 * Requirements:
 *   - GOOGLE_PLACES_API_KEY in env/.env.local
 *   - SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env/.env.local
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../../env/.env.local') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const GOOGLE_PLACES_API_KEY = process.env.GOOGLE_PLACES_API_KEY;

// Major cities in states with legal cannabis (medical or recreational)
const CITIES = [
  // California (Recreational)
  { name: 'Los Angeles', state: 'CA', lat: 34.0522, lng: -118.2437 },
  { name: 'San Francisco', state: 'CA', lat: 37.7749, lng: -122.4194 },
  { name: 'San Diego', state: 'CA', lat: 32.7157, lng: -117.1611 },
  { name: 'Sacramento', state: 'CA', lat: 38.5816, lng: -121.4944 },
  { name: 'Oakland', state: 'CA', lat: 37.8044, lng: -122.2712 },
  
  // Colorado (Recreational)
  { name: 'Denver', state: 'CO', lat: 39.7392, lng: -104.9903 },
  { name: 'Colorado Springs', state: 'CO', lat: 38.8339, lng: -104.8214 },
  { name: 'Boulder', state: 'CO', lat: 40.0150, lng: -105.2705 },
  
  // Washington (Recreational)
  { name: 'Seattle', state: 'WA', lat: 47.6062, lng: -122.3321 },
  { name: 'Spokane', state: 'WA', lat: 47.6588, lng: -117.4260 },
  
  // Oregon (Recreational)
  { name: 'Portland', state: 'OR', lat: 45.5152, lng: -122.6784 },
  { name: 'Eugene', state: 'OR', lat: 44.0521, lng: -123.0868 },
  
  // Nevada (Recreational)
  { name: 'Las Vegas', state: 'NV', lat: 36.1699, lng: -115.1398 },
  { name: 'Reno', state: 'NV', lat: 39.5296, lng: -119.8138 },
  
  // Arizona (Recreational)
  { name: 'Phoenix', state: 'AZ', lat: 33.4484, lng: -112.0740 },
  { name: 'Tucson', state: 'AZ', lat: 32.2226, lng: -110.9747 },
  
  // Massachusetts (Recreational)
  { name: 'Boston', state: 'MA', lat: 42.3601, lng: -71.0589 },
  
  // Michigan (Recreational)
  { name: 'Detroit', state: 'MI', lat: 42.3314, lng: -83.0458 },
  
  // Illinois (Recreational)
  { name: 'Chicago', state: 'IL', lat: 41.8781, lng: -87.6298 },
  
  // New York (Recreational)
  { name: 'New York', state: 'NY', lat: 40.7128, lng: -74.0060 },
  
  // New Jersey (Recreational)
  { name: 'Newark', state: 'NJ', lat: 40.7357, lng: -74.1724 },
  
  // Arkansas (Medical)
  { name: 'Little Rock', state: 'AR', lat: 34.7465, lng: -92.2896 },
  { name: 'Hot Springs', state: 'AR', lat: 34.5037, lng: -93.0552 },
  { name: 'Fayetteville', state: 'AR', lat: 36.0626, lng: -94.1574 },
  
  // Oklahoma (Medical)
  { name: 'Oklahoma City', state: 'OK', lat: 35.4676, lng: -97.5164 },
  { name: 'Tulsa', state: 'OK', lat: 36.1540, lng: -95.9928 },
  
  // Florida (Medical)
  { name: 'Miami', state: 'FL', lat: 25.7617, lng: -80.1918 },
  { name: 'Orlando', state: 'FL', lat: 28.5383, lng: -81.3792 },
  { name: 'Tampa', state: 'FL', lat: 27.9506, lng: -82.4572 },
];

// Search keywords to catch all types of cannabis businesses
const SEARCH_KEYWORDS = [
  'cannabis dispensary',
  'marijuana dispensary',
  'medical marijuana',
  'cannabis pharmacy',
  'recreational marijuana',
  'weed dispensary',
  'cannabis store',
  'marijuana shop'
];

// Helper: Calculate distance between two points (Haversine formula)
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

// Helper: Extract city from address
function extractCity(address) {
  if (!address) return null;
  const parts = address.split(',');
  return parts.length > 1 ? parts[parts.length - 2].trim() : null;
}

// Helper: Extract state from address
function extractState(address) {
  if (!address) return null;
  const parts = address.split(',');
  const lastPart = parts[parts.length - 1]?.trim();
  const stateMatch = lastPart?.match(/\b([A-Z]{2})\b/);
  return stateMatch ? stateMatch[1] : null;
}

// Helper: Extract ZIP code from address
function extractZip(address) {
  if (!address) return null;
  const zipMatch = address.match(/\b(\d{5})\b/);
  return zipMatch ? zipMatch[1] : null;
}

// Search Google Places for dispensaries in a city
async function searchDispensariesInCity(city) {
  console.log(`\n🔍 Searching ${city.name}, ${city.state}...`);
  
  const radius = 50000; // 50km radius
  const allResults = new Map(); // Use Map to deduplicate by place_id

  for (const keyword of SEARCH_KEYWORDS) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${city.lat},${city.lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&key=${GOOGLE_PLACES_API_KEY}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === 'OK' && data.results) {
        for (const place of data.results) {
          if (!allResults.has(place.place_id)) {
            allResults.set(place.place_id, {
              place_id: place.place_id,
              name: place.name,
              address: place.vicinity,
              latitude: place.geometry.location.lat,
              longitude: place.geometry.location.lng,
              rating: place.rating || 0,
              review_count: place.user_ratings_total || 0,
              open_now: place.opening_hours?.open_now,
              types: place.types
            });
          }
        }
      } else if (data.status !== 'ZERO_RESULTS') {
        console.error(`  ⚠️  Error with keyword "${keyword}":`, data.status);
      }

      // Rate limiting - wait 100ms between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`  ❌ Failed to search with keyword "${keyword}":`, error.message);
    }
  }

  console.log(`  ✅ Found ${allResults.size} unique dispensaries`);
  return Array.from(allResults.values());
}

// Get detailed information for a place
async function getPlaceDetails(placeId) {
  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,formatted_phone_number,website,opening_hours,rating,user_ratings_total,geometry,types&key=${GOOGLE_PLACES_API_KEY}`;
    
    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== 'OK') {
      return null;
    }

    const result = data.result;
    return {
      name: result.name,
      address: result.formatted_address?.split(',')[0]?.trim() || '',
      full_address: result.formatted_address,
      city: extractCity(result.formatted_address),
      state: extractState(result.formatted_address),
      zip_code: extractZip(result.formatted_address),
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      phone: result.formatted_phone_number,
      website: result.website,
      rating: result.rating || 0,
      review_count: result.user_ratings_total || 0,
      types: result.types
    };
  } catch (error) {
    console.error(`  ❌ Failed to get details for ${placeId}:`, error.message);
    return null;
  }
}

// Import dispensary into database
async function importDispensary(dispensary) {
  try {
    // Check if already exists
    const { data: existing } = await supabase
      .from('dispensaries')
      .select('id')
      .eq('latitude', dispensary.latitude)
      .eq('longitude', dispensary.longitude)
      .single();

    if (existing) {
      console.log(`  ⏭️  Skipping ${dispensary.name} (already exists)`);
      return { skipped: true };
    }

    // Determine if medical/recreational based on types
    const isMedical = dispensary.types?.some(t => 
      t.includes('pharmacy') || t.includes('health')
    );

    // Insert into database
    const { data, error } = await supabase
      .from('dispensaries')
      .insert({
        name: dispensary.name,
        address: dispensary.address,
        city: dispensary.city,
        state: dispensary.state,
        country: 'USA',
        zip_code: dispensary.zip_code,
        latitude: dispensary.latitude,
        longitude: dispensary.longitude,
        phone: dispensary.phone,
        website: dispensary.website,
        description: `Cannabis dispensary in ${dispensary.city}, ${dispensary.state}`,
        rating: dispensary.rating,
        review_count: dispensary.review_count,
        verified: false, // Will be manually verified later
        delivery_available: false,
        medical_only: isMedical,
        recreational_available: !isMedical
      })
      .select();

    if (error) {
      console.error(`  ❌ Failed to import ${dispensary.name}:`, error.message);
      return { error };
    }

    console.log(`  ✅ Imported ${dispensary.name}`);
    return { success: true, data };
  } catch (error) {
    console.error(`  ❌ Exception importing ${dispensary.name}:`, error.message);
    return { error };
  }
}

// Main function
async function main() {
  console.log('🌿 StrainSpotter - Nationwide Dispensary Importer\n');
  console.log(`📍 Searching ${CITIES.length} cities`);
  console.log(`🔑 Using ${SEARCH_KEYWORDS.length} search keywords\n`);

  if (!GOOGLE_PLACES_API_KEY) {
    console.error('❌ GOOGLE_PLACES_API_KEY not found in environment');
    process.exit(1);
  }

  let totalFound = 0;
  let totalImported = 0;
  let totalSkipped = 0;
  let totalErrors = 0;

  for (const city of CITIES) {
    const dispensaries = await searchDispensariesInCity(city);
    totalFound += dispensaries.length;

    // Get details and import each dispensary
    for (const disp of dispensaries) {
      const details = await getPlaceDetails(disp.place_id);
      
      if (details) {
        const result = await importDispensary(details);
        
        if (result.success) totalImported++;
        else if (result.skipped) totalSkipped++;
        else totalErrors++;
      }

      // Rate limiting - wait 200ms between detail requests
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 Import Summary:');
  console.log('='.repeat(60));
  console.log(`🔍 Total found:     ${totalFound}`);
  console.log(`✅ Imported:        ${totalImported}`);
  console.log(`⏭️  Skipped:         ${totalSkipped}`);
  console.log(`❌ Errors:          ${totalErrors}`);
  console.log('='.repeat(60));
  console.log('\n✨ Import complete!\n');
}

// Run the script
main().catch(console.error);

