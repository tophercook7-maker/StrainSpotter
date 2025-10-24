# StrainSpotter

A Mac-friendly workspace for the StrainSpotter app.

- Backend: Express API on port 5181 (see `backend/`)
- Frontend: React + Vite starter (see `frontend/`)
- Tools: Data pipeline scripts (see `tools/`)
- Env: Put secrets in `env/.env.local` (not in `backend/.env`)

## Quick Start

1) Open this folder in VS Code
2) Copy your secrets into `env/.env.local` (see `VERCEL_ENV_SETUP.md`)
3) Terminal → Run Task → Install Backend Deps
4) Terminal → Run Task → Start Backend
5) Visit <http://localhost:5181/health> (should return `{ ok: true, ... }`)
6) (Optional) Terminal → Run Task → Start Frontend → <http://localhost:5173>

### Helpful Scripts/Configs

- `backend/` → `npm run dev` starts the API
- `scripts/setup.js` checks your Supabase and Google Vision env
- `pm2/ecosystem.config.cjs` for crash-resistant local runs (PM2)

### Notes

- Avoid manual edits to `backend/data/*.json`. Use the tools in `tools/` and re-run the pipeline instead.
- Keep ports consistent: backend 5181, frontend 5173. Update `CORS_ALLOW_ORIGINS` if needed.
