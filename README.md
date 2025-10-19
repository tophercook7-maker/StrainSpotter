<<<<<<< HEAD
# StrainSpotter Starter Workspace

This is a clean, Mac-friendly starter for StrainSpotter with:
- VS Code tasks to run/install
- A minimal Express backend with `/health`
- PM2 config for crash-resistant local runs
- A setup checker (`scripts/setup.js`)
- One place for environment variables: `env/.env.local`

## Quick Start

1) Open this folder in VS Code.
2) Duplicate `env/.env.local.example` to `env/.env.local` and fill values.
3) In VS Code: **Terminal → Run Task → Install Backend Deps**.
4) Then run **Start Backend** task. Visit http://localhost:5181/health

### Scripts

- `backend`: Express server (port 5181 by default).
- `scripts/setup.js`: validates you configured Supabase and Google Vision.
- `pm2/ecosystem.config.cjs`: run `pm2 start pm2/ecosystem.config.cjs` for auto-restart.

### Frontend

This starter leaves `frontend/` empty so you can drop in your Vite/Next app.
Point it to the backend at `http://localhost:5181`.

### Notes

- Avoid heredocs and fragile copy/paste. Use this workspace + VS Code tasks.
- All secrets live in `env/.env.local` (ignored by git).
=======
StrainSpotter
>>>>>>> 5e2d399b586b433cc540593cd589b87053b27348
