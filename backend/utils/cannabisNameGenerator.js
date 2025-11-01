/**
 * Cannabis-Themed Username and Avatar Generator
 * 
 * Automatically generates cool weed/farming industry usernames and avatars
 * for new StrainSpotter users
 */

// Cannabis-themed adjectives
const adjectives = [
  'Green', 'Purple', 'Golden', 'Emerald', 'Crystal', 'Frosty', 'Sticky',
  'Dank', 'Chronic', 'Premium', 'Organic', 'Wild', 'Sacred', 'Ancient',
  'Northern', 'Southern', 'Mountain', 'Valley', 'Coastal', 'Island',
  'Mystic', 'Magic', 'Royal', 'Noble', 'Elite', 'Master', 'Expert',
  'Legendary', 'Epic', 'Supreme', 'Ultimate', 'Prime', 'Pure', 'Natural',
  'Solar', 'Lunar', 'Stellar', 'Cosmic', 'Zen', 'Chill', 'Mellow',
  'Happy', 'Peaceful', 'Serene', 'Tranquil', 'Blissful', 'Euphoric'
];

// Cannabis-related nouns
const nouns = [
  'Grower', 'Cultivator', 'Farmer', 'Gardener', 'Botanist', 'Breeder',
  'Bud', 'Leaf', 'Flower', 'Bloom', 'Harvest', 'Crop', 'Plant', 'Seed',
  'Kush', 'Haze', 'Diesel', 'Skunk', 'Widow', 'Dream', 'Express',
  'Terpene', 'Trichome', 'Cannabinoid', 'Resin', 'Nectar',
  'Garden', 'Grove', 'Farm', 'Field', 'Greenhouse', 'Nursery',
  'Guru', 'Sensei', 'Master', 'Wizard', 'Sage', 'Oracle', 'Shaman',
  'Captain', 'Chief', 'King', 'Queen', 'Prince', 'Princess',
  'Whisperer', 'Keeper', 'Guardian', 'Protector', 'Tender'
];

// Strain-inspired names
const strainNames = [
  'OG', 'Kush', 'Haze', 'Diesel', 'Skunk', 'Widow', 'Dream', 'Express',
  'Cookies', 'Cake', 'Pie', 'Gelato', 'Sherbet', 'Runtz', 'Zkittlez',
  'Glue', 'Wreck', 'Jack', 'Bruce', 'Larry', 'Chemdawg', 'Headband',
  'Tangie', 'Durban', 'Trainwreck', 'AK47', 'Blueberry', 'Strawberry',
  'Pineapple', 'Mango', 'Lemon', 'Lime', 'Cherry', 'Grape', 'Melon'
];

// Numbers/suffixes for uniqueness
const suffixes = [
  '420', '710', '247', '365', '2024', '2025',
  'OG', 'Pro', 'Elite', 'Prime', 'Max', 'Ultra', 'Mega', 'Super',
  'X', 'XL', 'XXL', 'Plus', 'Premium', 'Deluxe'
];

// Avatar color schemes (cannabis-themed)
const avatarColors = [
  { name: 'green', bg: '10b981', seed: 'cannabis' },      // Emerald green
  { name: 'purple', bg: '8b5cf6', seed: 'purplekush' },   // Purple kush
  { name: 'orange', bg: 'f97316', seed: 'orangehaze' },   // Orange haze
  { name: 'lime', bg: '84cc16', seed: 'limeskunk' },      // Lime green
  { name: 'teal', bg: '14b8a6', seed: 'oceanblue' },      // Ocean blue
  { name: 'pink', bg: 'ec4899', seed: 'pinkdream' },      // Pink dream
  { name: 'yellow', bg: 'eab308', seed: 'goldennugget' }, // Golden
  { name: 'indigo', bg: '6366f1', seed: 'northernlights' }, // Northern lights
  { name: 'red', bg: 'ef4444', seed: 'cherrydiesel' },    // Cherry red
  { name: 'cyan', bg: '06b6d4', seed: 'blueberry' }       // Blueberry
];

/**
 * Generate a random cannabis-themed username
 * @param {string} email - User's email (optional, for seeding)
 * @returns {string} Generated username
 */
export function generateCannabisUsername(email = null) {
  // If email provided, use it to seed randomness for consistency
  const seed = email ? hashCode(email) : Math.random();
  
  // Choose pattern randomly
  const pattern = Math.floor((seed % 1) * 5);
  
  let username;
  
  switch (pattern) {
    case 0:
      // Pattern: Adjective + Noun (e.g., "GreenGrower")
      username = randomChoice(adjectives, seed) + randomChoice(nouns, seed * 2);
      break;
    
    case 1:
      // Pattern: Adjective + Strain (e.g., "PurpleKush")
      username = randomChoice(adjectives, seed) + randomChoice(strainNames, seed * 2);
      break;
    
    case 2:
      // Pattern: Strain + Noun (e.g., "KushMaster")
      username = randomChoice(strainNames, seed) + randomChoice(nouns, seed * 2);
      break;
    
    case 3:
      // Pattern: Adjective + Noun + Suffix (e.g., "GreenGrower420")
      username = randomChoice(adjectives, seed) + randomChoice(nouns, seed * 2) + randomChoice(suffixes, seed * 3);
      break;
    
    case 4:
      // Pattern: "The" + Adjective + Noun (e.g., "TheGreenGuru")
      username = 'The' + randomChoice(adjectives, seed) + randomChoice(nouns, seed * 2);
      break;
    
    default:
      username = randomChoice(adjectives, seed) + randomChoice(nouns, seed * 2);
  }
  
  return username;
}

/**
 * Generate a cannabis-themed avatar URL
 * @param {string} username - Generated username (for seeding)
 * @returns {string} Avatar URL
 */
export function generateCannabisAvatar(username) {
  // Pick a color scheme based on username
  const colorIndex = hashCode(username) % avatarColors.length;
  const color = avatarColors[colorIndex];
  
  // Generate DiceBear avatar with cannabis theme
  return `https://api.dicebear.com/7.x/bottts/svg?seed=${color.seed}-${username}&backgroundColor=${color.bg}`;
}

/**
 * Generate a random farm name
 * @param {string} username - User's username (for consistency)
 * @returns {string} Farm name
 */
export function generateFarmName(username) {
  const seed = hashCode(username);
  
  const farmAdjectives = [
    'Green', 'Golden', 'Emerald', 'Crystal', 'Sacred', 'Hidden',
    'Sunset', 'Sunrise', 'Mountain', 'Valley', 'River', 'Ocean',
    'Forest', 'Meadow', 'Highland', 'Coastal', 'Island', 'Paradise',
    'Zen', 'Peaceful', 'Serene', 'Tranquil', 'Mystic', 'Magic'
  ];
  
  const farmNouns = [
    'Gardens', 'Farms', 'Groves', 'Fields', 'Acres', 'Ranch',
    'Greenhouse', 'Nursery', 'Cultivation', 'Botanicals', 'Organics',
    'Harvest', 'Crops', 'Blooms', 'Flowers', 'Buds', 'Leaves'
  ];
  
  return randomChoice(farmAdjectives, seed) + ' ' + randomChoice(farmNouns, seed * 2);
}

/**
 * Generate complete user profile data
 * @param {string} email - User's email
 * @returns {object} Profile data with username, avatar, farm name
 */
export function generateCannabisProfile(email) {
  const username = generateCannabisUsername(email);
  const avatar = generateCannabisAvatar(username);
  const farmName = generateFarmName(username);
  const displayName = username.replace(/([A-Z])/g, ' $1').trim(); // Add spaces before capitals
  
  return {
    username,
    displayName,
    avatarUrl: avatar,
    farmName,
    bio: `Cannabis enthusiast and cultivator at ${farmName}`,
    growerBio: `Passionate about growing quality cannabis. Always learning and sharing knowledge with the community.`
  };
}

/**
 * Check if username is available in database
 * @param {string} username - Username to check
 * @param {object} supabase - Supabase client
 * @returns {Promise<boolean>} True if available
 */
export async function isUsernameAvailable(username, supabase) {
  const { data, error } = await supabase
    .from('profiles')
    .select('username')
    .eq('username', username)
    .single();
  
  return !data && !error;
}

/**
 * Generate unique username (adds numbers if taken)
 * @param {string} baseUsername - Base username
 * @param {object} supabase - Supabase client
 * @returns {Promise<string>} Unique username
 */
export async function generateUniqueUsername(baseUsername, supabase) {
  let username = baseUsername;
  let counter = 1;
  
  while (!(await isUsernameAvailable(username, supabase))) {
    username = `${baseUsername}${counter}`;
    counter++;
    
    // Prevent infinite loop
    if (counter > 100) {
      username = `${baseUsername}${Date.now()}`;
      break;
    }
  }
  
  return username;
}

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Simple hash function for seeding randomness
 */
function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Choose random item from array using seed
 */
function randomChoice(array, seed) {
  const index = Math.floor((seed % 1) * array.length);
  return array[index];
}

/**
 * Get random specialties for grower profile
 */
export function getRandomSpecialties(username) {
  const seed = hashCode(username);
  
  const allSpecialties = [
    'indoor', 'outdoor', 'greenhouse', 'hydroponics', 'soil',
    'organic', 'living soil', 'no-till', 'regenerative',
    'breeding', 'genetics', 'phenotype hunting', 'seed production',
    'LED growing', 'HPS growing', 'natural light',
    'indica specialist', 'sativa specialist', 'hybrid specialist',
    'autoflower', 'photoperiod', 'feminized seeds'
  ];
  
  // Pick 3-5 random specialties
  const count = 3 + (seed % 3);
  const specialties = [];
  
  for (let i = 0; i < count; i++) {
    const index = (seed * (i + 1)) % allSpecialties.length;
    const specialty = allSpecialties[index];
    if (!specialties.includes(specialty)) {
      specialties.push(specialty);
    }
  }
  
  return specialties;
}

/**
 * Get random experience years (3-20)
 */
export function getRandomExperienceYears(username) {
  const seed = hashCode(username);
  return 3 + (seed % 18); // 3-20 years
}

/**
 * Get random location (US states with legal cannabis)
 */
export function getRandomLocation(username) {
  const seed = hashCode(username);
  
  const locations = [
    { city: 'Denver', state: 'Colorado' },
    { city: 'Portland', state: 'Oregon' },
    { city: 'Seattle', state: 'Washington' },
    { city: 'Los Angeles', state: 'California' },
    { city: 'San Francisco', state: 'California' },
    { city: 'Sacramento', state: 'California' },
    { city: 'Las Vegas', state: 'Nevada' },
    { city: 'Phoenix', state: 'Arizona' },
    { city: 'Tucson', state: 'Arizona' },
    { city: 'Anchorage', state: 'Alaska' },
    { city: 'Detroit', state: 'Michigan' },
    { city: 'Ann Arbor', state: 'Michigan' },
    { city: 'Boston', state: 'Massachusetts' },
    { city: 'Chicago', state: 'Illinois' },
    { city: 'Albuquerque', state: 'New Mexico' },
    { city: 'Montpelier', state: 'Vermont' },
    { city: 'Trenton', state: 'New Jersey' }
  ];
  
  const index = seed % locations.length;
  return locations[index];
}

