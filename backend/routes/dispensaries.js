import express from 'express';

const router = express.Router();

// Seed dataset with dispensaries across legal cannabis states
// Note: includes lat/lng so we can filter by distance when the client sends location
const DISPENSARIES = [
  // California
  {
    id: 'disp-ca-sf',
    name: 'Golden Gate Cannabis',
    address: '2165 Irving St',
    city: 'San Francisco',
    state: 'CA',
    zip: '94122',
    phone: '(415) 682-4420',
    description: 'Premium flower, concentrates, and edibles in the Sunset District.',
    lat: 37.7638,
    lng: -122.4783
  },
  {
    id: 'disp-ca-la',
    name: 'MedMen West Hollywood',
    address: '8208 Santa Monica Blvd',
    city: 'West Hollywood',
    state: 'CA',
    zip: '90046',
    phone: '(323) 848-6633',
    description: 'Upscale dispensary with knowledgeable staff and curated selection.',
    lat: 34.0901,
    lng: -118.3708
  },
  {
    id: 'disp-ca-sd',
    name: 'Urbn Leaf San Diego',
    address: '1433 University Ave',
    city: 'San Diego',
    state: 'CA',
    zip: '92103',
    phone: '(619) 343-6060',
    description: 'Modern dispensary in Hillcrest with wide selection and daily deals.',
    lat: 32.7487,
    lng: -117.1549
  },
  {
    id: 'disp-ca-sac',
    name: 'Abatin Wellness Center',
    address: '2100 29th St',
    city: 'Sacramento',
    state: 'CA',
    zip: '95817',
    phone: '(916) 394-5336',
    description: 'Community-focused dispensary with compassionate care.',
    lat: 38.5670,
    lng: -121.4669
  },
  {
    id: 'disp-ca-oakland',
    name: 'Harborside Oakland',
    address: '1840 Embarcadero',
    city: 'Oakland',
    state: 'CA',
    zip: '94606',
    phone: '(510) 587-1065',
    description: 'One of the largest and oldest dispensaries in the world.',
    lat: 37.7886,
    lng: -122.2777
  },
  {
    id: 'disp-ca-sj',
    name: 'Airfield Supply Company',
    address: '1268 S 7th St',
    city: 'San Jose',
    state: 'CA',
    zip: '95112',
    phone: '(408) 540-4490',
    description: 'Award-winning dispensary with farm-to-table cannabis.',
    lat: 37.3207,
    lng: -121.8742
  },
  {
    id: 'disp-ca-fresno',
    name: 'Mercy Wellness',
    address: '530 S Teilman Ave',
    city: 'Fresno',
    state: 'CA',
    zip: '93706',
    phone: '(559) 454-1996',
    description: 'Central Valley\'s premier cannabis destination.',
    lat: 36.7283,
    lng: -119.8121
  },
  {
    id: 'disp-ca-longbeach',
    name: 'The Greenery',
    address: '3751 Long Beach Blvd',
    city: 'Long Beach',
    state: 'CA',
    zip: '90807',
    phone: '(562) 427-1220',
    description: 'Modern dispensary with extensive product selection.',
    lat: 33.8334,
    lng: -118.1896
  },
  {
    id: 'disp-ca-santa-rosa',
    name: 'Coastal Dispensary',
    address: '1360 N Dutton Ave',
    city: 'Santa Rosa',
    state: 'CA',
    zip: '95401',
    phone: '(707) 527-7701',
    description: 'Sonoma County cannabis with local growers.',
    lat: 38.4574,
    lng: -122.7297
  },
  {
    id: 'disp-ca-modesto',
    name: 'The Farmacy',
    address: '1524 McHenry Ave',
    city: 'Modesto',
    state: 'CA',
    zip: '95350',
    phone: '(209) 576-2420',
    description: 'Family-owned dispensary serving Modesto since 2018.',
    lat: 37.6391,
    lng: -120.9966
  },
  {
    id: 'disp-ca-stockton',
    name: 'Emerald Perspective',
    address: '445 E Weber Ave',
    city: 'Stockton',
    state: 'CA',
    zip: '95202',
    phone: '(209) 464-3420',
    description: 'Stockton\'s first recreational cannabis shop.',
    lat: 37.9510,
    lng: -121.2893
  },
  {
    id: 'disp-ca-riverside',
    name: 'March and Ash',
    address: '1314 N Main St',
    city: 'Riverside',
    state: 'CA',
    zip: '92501',
    phone: '(951) 224-5420',
    description: 'Inland Empire\'s upscale cannabis experience.',
    lat: 33.9895,
    lng: -117.3752
  },
  {
    id: 'disp-ca-bakersfield',
    name: 'The Pottery',
    address: '2000 18th St',
    city: 'Bakersfield',
    state: 'CA',
    zip: '93301',
    phone: '(661) 425-4200',
    description: 'Kern County\'s premier dispensary.',
    lat: 35.3690,
    lng: -119.0144
  },
  
  // Colorado
  {
    id: 'disp-co-denver',
    name: 'The Green Solution',
    address: '4400 Grape St',
    city: 'Denver',
    state: 'CO',
    zip: '80216',
    phone: '(303) 296-4420',
    description: 'Colorado\'s largest dispensary chain with premium products.',
    lat: 39.7789,
    lng: -104.9509
  },
  {
    id: 'disp-co-boulder',
    name: 'Native Roots Boulder',
    address: '1902 Folsom St',
    city: 'Boulder',
    state: 'CO',
    zip: '80302',
    phone: '(303) 442-4204',
    description: 'Award-winning dispensary with organic cultivation.',
    lat: 40.0176,
    lng: -105.2659
  },
  {
    id: 'disp-co-springs',
    name: 'Emerald Fields',
    address: '4885 N Academy Blvd',
    city: 'Colorado Springs',
    state: 'CO',
    zip: '80918',
    phone: '(719) 358-8540',
    description: 'Southern Colorado\'s trusted cannabis source.',
    lat: 38.8817,
    lng: -104.7949
  },
  {
    id: 'disp-co-aurora',
    name: 'Standing Akimbo',
    address: '7800 Smith Rd',
    city: 'Denver',
    state: 'CO',
    zip: '80207',
    phone: '(303) 209-0420',
    description: 'Denver metro area leader in quality cannabis.',
    lat: 39.7392,
    lng: -104.8950
  },
  {
    id: 'disp-co-pueblo',
    name: 'Starbuds Pueblo',
    address: '1647 S Prairie Ave',
    city: 'Pueblo',
    state: 'CO',
    zip: '81005',
    phone: '(719) 544-0420',
    description: 'Southern Colorado cannabis with friendly service.',
    lat: 38.2358,
    lng: -104.6091
  },
  {
    id: 'disp-co-fort-collins',
    name: 'Organic Alternatives',
    address: '209 S College Ave',
    city: 'Fort Collins',
    state: 'CO',
    zip: '80524',
    phone: '(970) 484-1620',
    description: 'Northern Colorado\'s organic cannabis pioneer.',
    lat: 40.5853,
    lng: -105.0766
  },
  
  // Washington
  {
    id: 'disp-wa-seattle',
    name: 'Have a Heart',
    address: '120 Westlake Ave N',
    city: 'Seattle',
    state: 'WA',
    zip: '98109',
    phone: '(206) 420-4206',
    description: 'Seattle\'s favorite dispensary with top-shelf cannabis.',
    lat: 47.6205,
    lng: -122.3376
  },
  {
    id: 'disp-wa-spokane',
    name: 'Satori Cannabis',
    address: '1621 N Monroe St',
    city: 'Spokane',
    state: 'WA',
    zip: '99205',
    phone: '(509) 315-5200',
    description: 'Eastern Washington\'s premier cannabis destination.',
    lat: 47.6774,
    lng: -117.4304
  },
  {
    id: 'disp-wa-tacoma',
    name: 'World of Weed',
    address: '8016 S Tacoma Way',
    city: 'Tacoma',
    state: 'WA',
    zip: '98409',
    phone: '(253) 589-9333',
    description: 'Tacoma\'s largest selection of cannabis products.',
    lat: 47.1799,
    lng: -122.4649
  },
  {
    id: 'disp-wa-bellingham',
    name: 'Top Shelf Cannabis',
    address: '3506 Meridian St',
    city: 'Bellingham',
    state: 'WA',
    zip: '98225',
    phone: '(360) 756-9333',
    description: 'Whatcom County\'s premier dispensary.',
    lat: 48.7787,
    lng: -122.4865
  },
  {
    id: 'disp-wa-olympia',
    name: 'Cannavista',
    address: '1708 Harrison Ave NW',
    city: 'Olympia',
    state: 'WA',
    zip: '98502',
    phone: '(360) 338-9420',
    description: 'Capitol city cannabis with quality service.',
    lat: 47.0379,
    lng: -122.9258
  },
  {
    id: 'disp-wa-vancouver',
    name: 'Main Street Marijuana',
    address: '8101 NE Parkway Dr',
    city: 'Vancouver',
    state: 'WA',
    zip: '98662',
    phone: '(360) 750-9333',
    description: 'Southwest Washington\'s trusted cannabis retailer.',
    lat: 45.6587,
    lng: -122.5621
  },
  
  // Oregon
  {
    id: 'disp-or-portland',
    name: 'Serra Portland',
    address: '2933 NE Alberta St',
    city: 'Portland',
    state: 'OR',
    zip: '97211',
    phone: '(503) 477-9333',
    description: 'Boutique dispensary on Alberta with curated strains.',
    lat: 45.5589,
    lng: -122.6359
  },
  {
    id: 'disp-or-eugene',
    name: 'Nectar Eugene',
    address: '1631 W 6th Ave',
    city: 'Eugene',
    state: 'OR',
    zip: '97402',
    phone: '(541) 636-8620',
    description: 'Oregon\'s largest cannabis retailer with great prices.',
    lat: 44.0462,
    lng: -123.1046
  },
  {
    id: 'disp-or-salem',
    name: 'La Mota Salem',
    address: '3728 River Rd N',
    city: 'Salem',
    state: 'OR',
    zip: '97303',
    phone: '(503) 585-9333',
    description: 'Salem\'s premier cannabis shop with top brands.',
    lat: 44.9776,
    lng: -123.0208
  },
  {
    id: 'disp-or-bend',
    name: 'Substance',
    address: '62980 NE 18th St',
    city: 'Bend',
    state: 'OR',
    zip: '97701',
    phone: '(541) 728-3420',
    description: 'Central Oregon cannabis with local flavor.',
    lat: 44.0582,
    lng: -121.2788
  },
  {
    id: 'disp-or-medford',
    name: 'TJ\'s Provisions',
    address: '320 Crater Lake Ave',
    city: 'Medford',
    state: 'OR',
    zip: '97504',
    phone: '(541) 245-4200',
    description: 'Southern Oregon\'s trusted cannabis source.',
    lat: 42.3265,
    lng: -122.8756
  },
  
  // Nevada
  {
    id: 'disp-nv-vegas',
    name: 'Planet 13',
    address: '2548 W Desert Inn Rd',
    city: 'Las Vegas',
    state: 'NV',
    zip: '89109',
    phone: '(702) 815-1313',
    description: 'World\'s largest dispensary - an immersive cannabis experience.',
    lat: 36.1302,
    lng: -115.1850
  },
  {
    id: 'disp-nv-reno',
    name: 'The Dispensary NV',
    address: '1675 E 2nd St',
    city: 'Reno',
    state: 'NV',
    zip: '89502',
    phone: '(775) 348-0001',
    description: 'Northern Nevada\'s trusted cannabis source.',
    lat: 39.5322,
    lng: -119.7915
  },
  {
    id: 'disp-nv-henderson',
    name: 'Oasis Cannabis',
    address: '1800 Industrial Rd',
    city: 'Las Vegas',
    state: 'NV',
    zip: '89102',
    phone: '(702) 420-2405',
    description: 'Vegas valley premier dispensary near the Strip.',
    lat: 36.1627,
    lng: -115.1656
  },
  {
    id: 'disp-nv-sparks',
    name: 'Sierra Well',
    address: '6185 Lakeside Dr',
    city: 'Reno',
    state: 'NV',
    zip: '89511',
    phone: '(775) 324-4200',
    description: 'Reno-Sparks cannabis with quality selection.',
    lat: 39.5296,
    lng: -119.7517
  },
  
  // Michigan
  {
    id: 'disp-mi-detroit',
    name: 'Greenhouse of Walled Lake',
    address: '43750 Pontiac Trail',
    city: 'Walled Lake',
    state: 'MI',
    zip: '48390',
    phone: '(248) 624-9333',
    description: 'Metro Detroit\'s premier provisioning center.',
    lat: 42.5370,
    lng: -83.4816
  },
  {
    id: 'disp-mi-ann-arbor',
    name: 'Arbors Wellness',
    address: '321 E Liberty St',
    city: 'Ann Arbor',
    state: 'MI',
    zip: '48104',
    phone: '(734) 585-0747',
    description: 'Medical and recreational cannabis in downtown Ann Arbor.',
    lat: 42.2793,
    lng: -83.7432
  },
  {
    id: 'disp-mi-grand-rapids',
    name: 'Gage Cannabis Co.',
    address: '1881 Eastern Ave SE',
    city: 'Grand Rapids',
    state: 'MI',
    zip: '49507',
    phone: '(616) 608-8420',
    description: 'West Michigan\'s premier cannabis retailer.',
    lat: 42.9490,
    lng: -85.6282
  },
  {
    id: 'disp-mi-lansing',
    name: 'Puff Cannabis',
    address: '3820 S Cedar St',
    city: 'Lansing',
    state: 'MI',
    zip: '48910',
    phone: '(517) 708-4200',
    description: 'Capital city cannabis with friendly service.',
    lat: 42.6946,
    lng: -84.5361
  },
  {
    id: 'disp-mi-kalamazoo',
    name: 'Winewood Organics',
    address: '5751 S Westnedge Ave',
    city: 'Portage',
    state: 'MI',
    zip: '49002',
    phone: '(269) 459-9333',
    description: 'Southwest Michigan\'s organic cannabis leader.',
    lat: 42.1944,
    lng: -85.5801
  },
  {
    id: 'disp-mi-flint',
    name: 'Joyology Flint',
    address: '4028 Corunna Rd',
    city: 'Flint',
    state: 'MI',
    zip: '48532',
    phone: '(810) 424-4200',
    description: 'Flint\'s trusted cannabis destination.',
    lat: 43.0297,
    lng: -83.6597
  },
  
  // Illinois
  {
    id: 'disp-il-chicago',
    name: 'Dispensary 33',
    address: '5001 N Clark St',
    city: 'Chicago',
    state: 'IL',
    zip: '60640',
    phone: '(773) 654-0710',
    description: 'Chicago\'s premier cannabis dispensary in Andersonville.',
    lat: 41.9733,
    lng: -87.6688
  },
  {
    id: 'disp-il-springfield',
    name: 'The Green Solution Springfield',
    address: '2720 S 6th St',
    city: 'Springfield',
    state: 'IL',
    zip: '62703',
    phone: '(217) 679-4420',
    description: 'Central Illinois cannabis with quality and service.',
    lat: 39.7648,
    lng: -89.6503
  },
  {
    id: 'disp-il-naperville',
    name: 'Rise Naperville',
    address: '1324 N Aurora Rd',
    city: 'Naperville',
    state: 'IL',
    zip: '60563',
    phone: '(630) 778-4200',
    description: 'Western suburbs premier cannabis dispensary.',
    lat: 41.7908,
    lng: -88.1856
  },
  {
    id: 'disp-il-peoria',
    name: 'NuMed',
    address: '2323 W Glen Ave',
    city: 'Peoria',
    state: 'IL',
    zip: '61614',
    phone: '(309) 693-4200',
    description: 'Central Illinois medical and recreational cannabis.',
    lat: 40.7242,
    lng: -89.6348
  },
  {
    id: 'disp-il-rockford',
    name: 'Sunnyside Rockford',
    address: '6861 E Riverside Blvd',
    city: 'Rockford',
    state: 'IL',
    zip: '61114',
    phone: '(815) 708-4200',
    description: 'Northern Illinois cannabis with trusted brands.',
    lat: 42.2711,
    lng: -88.9635
  },
  
  // Massachusetts
  {
    id: 'disp-ma-boston',
    name: 'NETA Brookline',
    address: '160 Washington St',
    city: 'Brookline',
    state: 'MA',
    zip: '02445',
    phone: '(617) 804-0477',
    description: 'Boston area\'s first adult-use dispensary.',
    lat: 42.3444,
    lng: -71.1211
  },
  {
    id: 'disp-ma-cambridge',
    name: 'Revolutionary Clinics Cambridge',
    address: '1 Hampshire St',
    city: 'Cambridge',
    state: 'MA',
    zip: '02139',
    phone: '(617) 766-0660',
    description: 'Harvard Square area cannabis with community focus.',
    lat: 42.3736,
    lng: -71.1097
  },
  {
    id: 'disp-ma-worcester',
    name: 'Good Chemistry Worcester',
    address: '492 Lincoln St',
    city: 'Worcester',
    state: 'MA',
    zip: '01605',
    phone: '(508) 713-4200',
    description: 'Central Massachusetts cannabis with quality selection.',
    lat: 42.2373,
    lng: -71.8273
  },
  {
    id: 'disp-ma-springfield',
    name: 'NETA Springfield',
    address: '1380 Main St',
    city: 'Springfield',
    state: 'MA',
    zip: '01103',
    phone: '(413) 322-4420',
    description: 'Western Mass cannabis pioneer with medical and adult-use.',
    lat: 42.1015,
    lng: -72.5898
  },
  {
    id: 'disp-ma-salem',
    name: 'Bask Salem',
    address: '180 Washington St',
    city: 'Salem',
    state: 'MA',
    zip: '01970',
    phone: '(978) 594-4200',
    description: 'North Shore cannabis with waterfront vibes.',
    lat: 42.5195,
    lng: -70.8967
  },
  
  // New York
  {
    id: 'disp-ny-brooklyn',
    name: 'Housing Works Cannabis Co. Brooklyn',
    address: '750 Flatbush Ave',
    city: 'Brooklyn',
    state: 'NY',
    zip: '11226',
    phone: '(718) 513-4200',
    description: 'Social justice cannabis in the heart of Brooklyn.',
    lat: 40.6565,
    lng: -73.9597
  },
  {
    id: 'disp-ny-buffalo',
    name: 'Cannabist Buffalo',
    address: '1262 Hertel Ave',
    city: 'Buffalo',
    state: 'NY',
    zip: '14216',
    phone: '(716) 444-4200',
    description: 'Western New York cannabis with community roots.',
    lat: 42.9448,
    lng: -78.8642
  },
  {
    id: 'disp-ny-rochester',
    name: 'Bloom Rochester',
    address: '2255 West Ridge Rd',
    city: 'Rochester',
    state: 'NY',
    zip: '14626',
    phone: '(585) 413-4200',
    description: 'Finger Lakes region cannabis with premium selection.',
    lat: 43.2126,
    lng: -77.7109
  },
  {
    id: 'disp-ny-albany',
    name: 'The Botanist Albany',
    address: '2 Industrial Park Rd',
    city: 'Albany',
    state: 'NY',
    zip: '12206',
    phone: '(518) 694-4200',
    description: 'Capital region cannabis with medical expertise.',
    lat: 42.6731,
    lng: -73.7834
  },
  {
    id: 'disp-ny-buffalo',
    name: 'Budega Buffalo',
    address: '1408 Hertel Ave',
    city: 'Buffalo',
    state: 'NY',
    zip: '14216',
    phone: '(716) 883-4420',
    description: 'Western New York\'s cannabis destination.',
    lat: 42.9543,
    lng: -78.8682
  },
  
  // Arizona
  {
    id: 'disp-az-mesa',
    name: 'Curaleaf Mesa',
    address: '1914 W Southern Ave',
    city: 'Mesa',
    state: 'AZ',
    zip: '85202',
    phone: '(480) 999-4200',
    description: 'East Valley cannabis with trusted quality.',
    lat: 33.3931,
    lng: -111.8449
  },
  {
    id: 'disp-az-flagstaff',
    name: 'Territory Dispensary Flagstaff',
    address: '1801 N Fort Valley Rd',
    city: 'Flagstaff',
    state: 'AZ',
    zip: '86001',
    phone: '(928) 714-4200',
    description: 'High-altitude cannabis in the pines.',
    lat: 35.2289,
    lng: -111.6783
  },
  {
    id: 'disp-az-scottsdale',
    name: 'The Mint Dispensary Scottsdale',
    address: '10831 N Scottsdale Rd',
    city: 'Scottsdale',
    state: 'AZ',
    zip: '85254',
    phone: '(480) 420-4200',
    description: 'Premium cannabis in upscale Scottsdale.',
    lat: 33.5579,
    lng: -111.9260
  },
  {
    id: 'disp-az-tempe',
    name: 'Nirvana Center Tempe',
    address: '1650 W Southern Ave',
    city: 'Tempe',
    state: 'AZ',
    zip: '85282',
    phone: '(480) 351-4200',
    description: 'ASU area cannabis with student-friendly prices.',
    lat: 33.3932,
    lng: -111.9753
  },
  // Arkansas (Medical)
  {
    id: 'disp-ar-little-rock',
    name: 'Acanza',
    address: '11321 Cantrell Rd',
    city: 'Little Rock',
    state: 'AR',
    zip: '72212',
    phone: '(501) 244-4200',
    description: 'Arkansas medical cannabis with compassionate care.',
    lat: 34.7704,
    lng: -92.4238
  },
  {
    id: 'disp-ar-bentonville',
    name: 'Purspirit Cannabis Co.',
    address: '1207 SE 28th St',
    city: 'Bentonville',
    state: 'AR',
    zip: '72712',
    phone: '(479) 464-4200',
    description: 'Northwest Arkansas medical dispensary.',
    lat: 36.3499,
    lng: -94.1972
  },
  {
    id: 'disp-ar-fayetteville',
    name: 'The Releaf Center',
    address: '1195 W Cato Springs Rd',
    city: 'Fayetteville',
    state: 'AR',
    zip: '72701',
    phone: '(479) 856-4200',
    description: 'Serving NWA with quality medical cannabis.',
    lat: 36.0822,
    lng: -94.1574
  },
  {
    id: 'disp-ar-fort-smith',
    name: 'Green Springs Medical',
    address: '3000 S 74th St',
    city: 'Fort Smith',
    state: 'AR',
    zip: '72903',
    phone: '(479) 434-4200',
    description: 'Fort Smith medical cannabis dispensary.',
    lat: 35.3495,
    lng: -94.3508
  },
  {
    id: 'disp-ar-jonesboro',
    name: 'ReLeaf Jonesboro',
    address: '3000 E Nettleton Ave',
    city: 'Jonesboro',
    state: 'AR',
    zip: '72401',
    phone: '(870) 974-4200',
    description: 'Northeast Arkansas medical cannabis.',
    lat: 35.8276,
    lng: -90.6641
  },
  {
    id: 'disp-az-tucson',
    name: 'Earth\'s Healing',
    address: '536 N 4th Ave',
    city: 'Tucson',
    state: 'AZ',
    zip: '85705',
    phone: '(520) 382-4420',
    description: 'Southern Arizona\'s trusted cannabis provider.',
    lat: 32.2267,
    lng: -110.9694
  }
];

function haversineMiles(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const R = 3958.8; // Earth radius in miles
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// GET /api/dispensaries?lat=..&lng=..&radius=50
// Also supports: /api/dispensaries?state=CA&city=San%20Francisco (fallback)
router.get('/', (req, res) => {
  const { lat, lng, radius, state, city } = req.query;

  // If client provided location, filter by distance
  const hasGeo = lat !== undefined && lng !== undefined;
  if (hasGeo) {
    const userLat = parseFloat(String(lat));
    const userLng = parseFloat(String(lng));
    if (Number.isNaN(userLat) || Number.isNaN(userLng)) {
      return res.status(400).json({ error: 'Invalid lat/lng' });
    }

    const radiusMiles = Math.max(1, Math.min(500, parseFloat(String(radius ?? '50')) || 50));
    const withDistance = DISPENSARIES
      .filter(d => typeof d.lat === 'number' && typeof d.lng === 'number')
      .map(d => {
        const distance = haversineMiles(userLat, userLng, d.lat, d.lng);
        return { ...d, distance };
      })
      .sort((a, b) => a.distance - b.distance);

    // Return dispensaries within radius, OR if none found, return the 5 closest
    const withinRadius = withDistance.filter(d => d.distance <= radiusMiles);
    if (withinRadius.length > 0) {
      console.log(`[dispensaries] Found ${withinRadius.length} within ${radiusMiles} mi of (${userLat}, ${userLng})`);
      return res.json(withinRadius);
    } else {
      console.log(`[dispensaries] No results within ${radiusMiles} mi, returning 5 closest`);
      const closest = withDistance.slice(0, 5);
      return res.json(closest);
    }
  }

  // Fallback: filter by state/city when no geolocation was provided
  let data = DISPENSARIES;
  if (state) data = data.filter(d => d.state?.toLowerCase() === String(state).toLowerCase());
  if (city) data = data.filter(d => d.city?.toLowerCase() === String(city).toLowerCase());
  res.json(data);
});

export default router;
