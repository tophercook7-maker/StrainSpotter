// Backend API configuration
// Use Render backend (always available)
export const API_BASE_URL = 'https://strainspotter-backend.onrender.com';

// API endpoints
export const API_ENDPOINTS = {
  // Scans
  createScan: '/api/scans',
  processScan: (scanId) => `/api/scans/${scanId}/process`,
  visualMatch: '/api/visual-match',
  
  // Credits
  getCredits: '/api/credits/balance',
  getCreditHistory: '/api/credits/history',
  purchaseCredits: '/api/credits/purchase',
  upgradeCredits: '/api/credits/upgrade',
  getPackages: '/api/credits/packages',
  
  // Strains
  getStrains: '/api/strains',
  getStrain: (id) => `/api/strains/${id}`,
  
  // Reviews
  getReviews: '/api/reviews',
  createReview: '/api/reviews',
  
  // Dispensaries
  searchDispensaries: '/api/dispensaries/search',
  
  // Seed vendors
  getSeedVendors: '/api/seed-vendors',
  
  // Groups
  getGroups: '/api/groups',
  
  // Feedback
  submitFeedback: '/api/feedback',
};

