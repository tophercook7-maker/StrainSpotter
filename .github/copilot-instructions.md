# StrainSpotter AI Agent Instructions

## Project Overview
StrainSpotter is a cannabis strain database and image scanning application with:
- **Backend**: Express.js API (port 5181) with Supabase database + Google Vision integration
- **Frontend**: React + Vite (basic starter - needs development by AI)
- **Mobile**: Capacitor-based iOS/Android app (`StrainSpotter_Starter_Integrated_v5/`)
- **Data Pipeline**: Node.js tools for scraping, normalizing, and importing strain data
- **Deployment**: PM2 for local dev; GitHub Actions for automated data updates

## Architecture & Data Flow

### Three-Layer Structure
1. **Backend (`backend/`)**: Express API serving strain data from JSON files + Supabase for user-generated content
2. **Frontend (`frontend/`)**: Vite/React starter with Material-UI - **AI should build this out**
3. **Tools (`tools/`)**: Data pipeline scripts that populate `backend/data/` JSON files

### Critical Path: Strain Data
- **Primary source**: `backend/data/strain_library.json` (loaded in-memory by Express for performance)
- **Supabase mirror**: `strains` table synced via import tools (optional, for persistence)
- Routes in `backend/routes/strains.js` watch `data/` directory and **auto-reload** on JSON changes
- Test mapping connects anonymous lab results to strains via `backend/data/test_mapping.json`
- Pipeline: scrape → normalize → enhance → import (orchestrated by `tools/full_pipeline.mjs`)

### Image Scanning Flow
1. Frontend → `POST /api/uploads` (base64 image)
2. Backend uploads to Supabase Storage bucket `scans`
3. `POST /api/scans/:id/process` triggers Google Vision API
4. Results saved to Supabase `scans` table with status tracking

### Supabase Database Schema
**Core tables** (see `backend/migrations/`):
- `scans` - Image scan results with Google Vision analysis
- `users` - User profiles (if not using Supabase Auth)
- `threads`, `thread_members`, `messages` - Chat/messaging system
- `strains` - Mirror of JSON data (columns: `slug`, `name`, `type`, `description`, `effects[]`, `flavors[]`, `lineage`, `thc`, `cbd`, `lab_test_results`)

## Environment Setup

**All secrets in `env/.env.local`** (never `backend/.env` or root `.env`):
```bash
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
GOOGLE_APPLICATION_CREDENTIALS=../env/google-vision-key.json
# OR inline: GOOGLE_VISION_JSON='{"type":"service_account",...}'
PORT=5181
```

Google Vision credentials: Backend automatically writes `GOOGLE_VISION_JSON` to file if provided inline (see `backend/supabaseClient.js`).

## Development Workflows

### Starting Backend
- **VS Code Task**: "Start Backend" (recommended) or "PM2 Start Backend" for crash recovery
- **Manual**: `cd backend && npm run dev`
- **Verify**: `http://localhost:5181/health` → should show `supabaseConfigured: true` and `googleVisionConfigured: true`

### Starting Frontend
- `cd frontend && npm run dev` (Vite dev server, usually port 5173)
- Point API calls to `http://localhost:5181`

### Mobile App Development
- **Build**: `cd StrainSpotter_Starter_Integrated_v5 && npm run build`
- **iOS**: `npm run cap:ios` (opens Xcode for local device testing)
- **Android**: Build via `npx cap open android`
- Uses on-device CLIP + OCR (Tesseract.js) for strain identification

### Validating Setup
- Run `node scripts/setup.js` to check env vars before first run

### Data Pipeline (run infrequently)
- **Full import**: `node tools/full_pipeline.mjs` (scrape → normalize → enhance → import to Supabase)
- **Single operations**: Run individual tools like `tools/normalize_strain_data.mjs`
- **Direct Supabase import**: `tools/import_to_supabase_robust.mjs` (includes retry logic)
- **Automated**: GitHub Actions workflow runs daily at 3 AM UTC (`.github/workflows/strain-pipeline.yml`)

### Testing & Linting
- **Frontend lint**: `cd frontend && npm run lint` (ESLint configured)
- **No backend tests yet** - add via Vitest/Jest if needed

### Route Modules
Backend uses modular routes mounted in `backend/index.js`:
- `/api/strains` → core CRUD (strains.js)
- `/api/compare`, `/api/notes`, `/api/reviews` → feature-specific routes
- `/api/availability`, `/api/growlogs`, `/api/legal`, `/api/trends` → additional features
- `/api/admin`, `/api/analytics` → admin operations

## Project-Specific Conventions

### File-Based Caching
- Backend serves strain data from **JSON files**, not live DB queries (performance optimization)
- Changes to `backend/data/*.json` trigger automatic reload via `fs.watch()`
- Always modify data via tools, not manual JSON edits

### Slug-Based Identification
- Strains use `slug` (URL-safe) as primary identifier: `/api/strains/:slug`
- Example: "Blue Dream" → slug: `blue-dream`

### Test Mapping Pattern
- Anonymous lab tests in `test_mapping.json` link to strains via `mappedTo: 'strain-slug'`
- Accessed via `/api/strains/:slug/tests` which merges direct + mapped results

### PM2 Configuration
- `pm2/ecosystem.config.cjs` watches `backend/` and `env/` for auto-restart
- Use tasks "PM2 Start Backend" / "PM2 Stop Backend" for persistent dev server

## Key Files to Reference

- `backend/README.md` - **Backend developer guide** with implementation patterns and examples
- `backend/index.js` - Main Express app with all route mounts
- `backend/routes/strains.js` - Core strain query logic with filtering/pagination
- `backend/supabaseClient.js` - Supabase client + Google Vision credential handling
- `backend/README-ENDPOINTS.md` - API endpoint documentation
- `tools/full_pipeline.mjs` - Complete data import workflow

## Common Pitfalls

1. **Wrong .env location**: Must be `env/.env.local`, not `backend/.env`
2. **File-based data not refreshing**: Check `backend/data/` has correct JSON files; server auto-reloads via `fs.watch()`
3. **Google Vision errors**: Ensure credentials JSON is valid and bucket `scans` is public in Supabase Storage
4. **Port conflicts**: Default is 5181 (backend), 5173 (frontend); check `env/.env.local` PORT setting
5. **Frontend disconnected**: Basic starter exists; AI should build features connecting to `http://localhost:5181`
6. **Mobile app Bundle ID**: Must be `com.yourco.StrainSpotter` in Capacitor config

## When Extending

- **New API route**: Create `backend/routes/myfeature.js`, mount in `backend/index.js`
- **New strain field**: Update `tools/normalize_strain_data.mjs` schema, re-run pipeline
- **Frontend features**: Connect to backend via fetch/axios; Material-UI + React Router already in deps
- **Data sources**: Add scraper to `tools/scrape_strain_sources.mjs`, integrate into `full_pipeline.mjs`
- **Database migrations**: Add SQL files to `backend/migrations/`, run in Supabase SQL editor
