# StrainSpotter Backend

Express.js API server serving cannabis strain data and image scanning capabilities.

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Verify it's running
curl http://localhost:5181/health
```

**Expected health response:**

```json
{
  "ok": true,
  "supabaseConfigured": true,
  "googleVisionConfigured": true
}
```

## Architecture Patterns

### File-Based Data Loading with Hot Reload

**Key Pattern**: Strain data is loaded from JSON files into memory and automatically reloads when files change.

```javascript
// In routes/strains.js
let strains = [];

function loadData() {
  strains = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'strain_library.json')));
}

// Watch for changes and auto-reload
fs.watch(DATA_DIR, (eventType, filename) => {
  if (filename?.endsWith('.json')) {
    loadData();
  }
});
```

**Why**: Performance optimization - serving 1000s of strains from memory is much faster than DB queries.

### Route Organization

Routes are modular and mounted in `index.js`:

```javascript
// Modular route imports
import strainRoutes from './routes/strains.js';
import compareRoutes from './routes/compare.js';

// Mount routes
app.use('/api', strainRoutes);           // /api/strains/*
app.use('/api/compare', compareRoutes);  // /api/compare/*
```

**Creating a new route module:**

1. Create `routes/myfeature.js`:

```javascript
import express from 'express';
const router = express.Router();

router.get('/endpoint', (req, res) => {
  res.json({ data: 'response' });
});

export default router;
```

2. Mount in `index.js`:

```javascript
import myFeatureRoutes from './routes/myfeature.js';
app.use('/api/myfeature', myFeatureRoutes);
```

### Pagination & Filtering Pattern

Standard approach used in `/api/strains`:

```javascript
router.get('/strains', (req, res) => {
  const { page = 1, limit = 20, sort, ...query } = req.query;
  
  // Filter by query params
  let results = filterStrains(query); // type, effect, flavor, minThc, maxThc
  
  // Sort if requested
  if (sort) {
    const [field, order] = sort.split(':');
    results.sort((a, b) => {
      return order === 'desc' ? (b[field] > a[field] ? 1 : -1) 
                               : (a[field] > b[field] ? 1 : -1);
    });
  }
  
  // Paginate
  const start = (page - 1) * limit;
  const paginatedResults = results.slice(start, start + parseInt(limit));
  
  res.json({
    total: results.length,
    page: parseInt(page),
    pages: Math.ceil(results.length / limit),
    strains: paginatedResults
  });
});
```

**Example requests:**

```bash
# Get all indica strains
GET /api/strains?type=indica

# Filter by THC range
GET /api/strains?minThc=20&maxThc=25

# Sort by THC descending
GET /api/strains?sort=thc:desc

# Paginate
GET /api/strains?page=2&limit=50
```

### Slug-Based Resource Identification

**Convention**: Resources use URL-safe slugs as identifiers:

```javascript
// Get strain by slug
router.get('/strains/:slug', (req, res) => {
  const strain = strains.find(s => s.slug === req.params.slug);
  if (!strain) return res.status(404).json({ error: 'Strain not found' });
  res.json(strain);
});
```

**Slug generation** (in `tools/normalize_strain_data.mjs`):

```javascript
const slugify = s => String(s)
  .toLowerCase()
  .normalize('NFKD')
  .replace(/[\u0300-\u036f]/g, '')  // Remove diacritics
  .replace(/[^a-z0-9\s-]/g, '')      // Remove special chars
  .trim()
  .replace(/\s+/g, '-')              // Spaces to hyphens
  .replace(/-+/g, '-');              // Collapse multiple hyphens

// "Blue Dream" → "blue-dream"
// "OG Kush #18" → "og-kush-18"
```

### Error Handling Pattern

Consistent error responses across routes:

```javascript
router.get('/endpoint', async (req, res) => {
  try {
    // Validation errors - 400
    if (!req.body.required) {
      return res.status(400).json({ error: 'required field missing' });
    }
    
    // Not found - 404
    const item = findItem(req.params.id);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }
    
    // Success - 200
    res.json(item);
    
  } catch (e) {
    // Server errors - 500
    res.status(500).json({ error: String(e) });
  }
});
```

### Google Vision Integration

**Pattern**: Upload image to Supabase Storage, then process with Vision API:

```javascript
// Step 1: Upload image
const buffer = Buffer.from(base64, 'base64');
const key = `${Date.now()}-${filename}`;
await supabase.storage.from('scans').upload(key, buffer);

// Step 2: Get public URL
const { data: urlData } = supabase.storage.from('scans').getPublicUrl(key);

// Step 3: Save scan record
await supabase.from('scans').insert({
  image_url: publicUrl,
  status: 'pending'
});

// Step 4: Process with Vision API
const [result] = await visionClient.annotateImage({
  image: { source: { imageUri: publicUrl } },
  features: [
    { type: 'LABEL_DETECTION' },
    { type: 'TEXT_DETECTION' },
    { type: 'OBJECT_LOCALIZATION' }
  ]
});

// Step 5: Update with results
await supabase.from('scans').update({
  result,
  status: 'done',
  processed_at: new Date().toISOString()
});
```

### Test Mapping Pattern

**Problem**: Anonymous lab test results need to link to named strains.

**Solution**: Mapping file (`data/test_mapping.json`):

```json
{
  "strains": {
    "test-id-123": {
      "mappedTo": "blue-dream",
      "thc": 24.5,
      "cbd": 0.8,
      "terpenes": {...}
    }
  }
}
```

**Usage in routes:**

```javascript
router.get('/strains/:slug/tests', (req, res) => {
  // Get direct lab results
  const directTests = strain.labTestResults || [];
  
  // Get mapped anonymous tests
  const mappedTests = [];
  Object.entries(testMapping.strains || {}).forEach(([id, data]) => {
    if (data.mappedTo === strain.slug) {
      mappedTests.push({ ...data, anonymous: true });
    }
  });
  
  res.json({
    strain: strain.name,
    directTests,
    mappedTests,
    stats: {
      totalTests: directTests.length + mappedTests.length,
      avgThc: [...directTests, ...mappedTests]
        .reduce((sum, t) => sum + (t.thc || 0), 0) / (directTests.length + mappedTests.length)
    }
  });
});
```

## API Endpoints

See [README-ENDPOINTS.md](./README-ENDPOINTS.md) for complete API documentation.

**Core endpoints:**

- `GET /health` - Health check
- `GET /api/strains` - List strains (with filtering/pagination)
- `GET /api/strains/:slug` - Get single strain
- `GET /api/strains/:slug/tests` - Get lab test results
- `POST /api/uploads` - Upload image for scanning
- `POST /api/scans/:id/process` - Process image with Google Vision

## Environment Variables

Located in `../env/.env.local` (NOT `backend/.env`):

```bash
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ... # Optional, for admin operations

# Google Vision (one of these)
GOOGLE_APPLICATION_CREDENTIALS=../env/google-vision-key.json
# OR
GOOGLE_VISION_JSON='{"type":"service_account",...}'

# Server
PORT=5181
```

**Credential handling** (in `supabaseClient.js`):

```javascript
// Auto-converts inline JSON to file if provided
if (process.env.GOOGLE_VISION_JSON && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  const credsPath = new URL('../env/google-vision-key.json', import.meta.url).pathname;
  fs.writeFileSync(credsPath, process.env.GOOGLE_VISION_JSON);
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credsPath;
}
```

## Database Schema

Run migrations in Supabase SQL editor (files in `migrations/`):

### Strains Table

```sql
-- Mirrored from JSON data (optional)
CREATE TABLE strains (
  slug text PRIMARY KEY,
  name text UNIQUE NOT NULL,
  type text,
  description text,
  effects text[],
  flavors text[],
  lineage jsonb,
  thc numeric,
  cbd numeric,
  lab_test_results jsonb
);
```

### Scans Table

```sql
-- Image scanning with Google Vision
CREATE TABLE scans (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  image_url text,
  status text DEFAULT 'pending',
  result jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now()
);
```

### Chat Tables

```sql
-- User messaging system
CREATE TABLE users (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  username text UNIQUE,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE threads (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  type text DEFAULT 'dm',
  name text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE messages (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  thread_id uuid REFERENCES threads(id) ON DELETE CASCADE,
  sender_id uuid REFERENCES users(id) ON DELETE SET NULL,
  content text,
  type text DEFAULT 'text',
  created_at timestamptz DEFAULT now()
);
```

## Testing

**Current state**: No automated tests yet.

**Recommended setup**:

```bash
npm install --save-dev vitest supertest

# package.json
"scripts": {
  "test": "vitest",
  "test:watch": "vitest --watch"
}
```

**Example test structure:**

```javascript
// tests/routes/strains.test.js
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import app from '../index.js';

describe('GET /api/strains', () => {
  it('returns paginated strains', async () => {
    const res = await request(app).get('/api/strains?limit=10');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('strains');
    expect(res.body.strains.length).toBeLessThanOrEqual(10);
  });
});
```

## Common Development Tasks

### Adding a New Route Module

1. Create `routes/newfeature.js`
1. Implement routes with express.Router()
1. Export default router
1. Import and mount in `index.js`
1. Document endpoints in `README-ENDPOINTS.md`

### Modifying Strain Schema

1. Update `tools/normalize_strain_data.mjs` with new field
1. Re-run data pipeline: `node tools/full_pipeline.mjs`
1. Update `backend/data/strain_library.json` gets new fields
1. Auto-reload triggers in `routes/strains.js` via `fs.watch()`

### Debugging Data Issues

```bash
# Check what data is loaded
curl http://localhost:5181/api/stats

# Verify JSON files exist
ls -lh backend/data/

# Watch server logs for reload events
# Look for: [watch] Reloading data due to changes in strain_library.json
```

## Performance Considerations

- **In-memory data**: Strain library (~2-5MB) loaded in memory for fast queries
- **File watching**: `fs.watch()` triggers reload on file changes (local dev only)
- **CORS**: Wide-open for development (`Access-Control-Allow-Origin: *`)
- **JSON body limit**: 10MB max for image uploads
- **Pagination**: Default 20 items per page to avoid large payloads

## Deployment Notes

**Local development**: PM2 for process management with auto-restart

```bash
pm2 start pm2/ecosystem.config.cjs
pm2 logs strainspotter-backend
pm2 stop strainspotter-backend
```

**Production considerations**:

- Set `NODE_ENV=production`
- Configure proper CORS origins
- Use service role key for Supabase admin operations
- Add rate limiting for public endpoints
- Consider Redis for caching instead of in-memory

## Related Documentation

- [Main Project Instructions](../.github/copilot-instructions.md) - Project overview and workflows
- [README-ENDPOINTS.md](./README-ENDPOINTS.md) - Complete API endpoint documentation
- [../tools/README.md](../tools/README.md) - Data pipeline documentation (if exists)
