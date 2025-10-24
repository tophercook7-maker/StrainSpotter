# Membership System Setup Guide

## Quick Fix: Run Migration in Supabase Dashboard

The membership application form currently doesn't work because the database tables haven't been created yet.

### Option 1: Supabase SQL Editor (Recommended)

1. **Open Supabase Dashboard**
   - Go to: https://app.supabase.com
   - Select your project: `strainspotter`
   - Click "SQL Editor" in the left sidebar

2. **Run the Migration**
   - Click "New query"
   - Copy the entire contents of:
     ```
     backend/migrations/2025_10_21_membership_tracking.sql
     ```
   - Paste into the SQL editor
   - Click "Run" button

3. **Verify Tables**
   After running, you should see these new tables in your database:
   - `membership_applications` - Stores join requests
   - `memberships` - Tracks active paid members
   - `trial_usage` - Tracks "Try Me" trial limits

### Option 2: Manual Table Creation (Quick Start)

If you just want to test the application form, run this minimal SQL in Supabase:

```sql
-- Minimal membership tables
CREATE TABLE IF NOT EXISTS membership_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  full_name TEXT,
  status TEXT DEFAULT 'active',
  tier TEXT DEFAULT 'full',
  joined_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Allow public inserts for applications
ALTER TABLE membership_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit" ON membership_applications
  FOR INSERT WITH CHECK (true);
```

## How the System Works

### For Users (Join Flow)
1. User visits `/membership-join` or clicks Pro-gated features
2. User fills out application form (email, name, optional phone/message)
3. Application is saved to `membership_applications` table with status `pending`
4. User sees success message: "We will review and contact you within 24-48 hours"

### For Admins (Approval Flow)
1. Admin visits `/membership-admin` (requires admin access)
2. Admin sees pending applications
3. Admin approves application, optionally entering payment details
4. System creates active membership in `memberships` table
5. User can now access Pro features

### Trial System ("Try Me" Mode)
- New users get 2 free scans + 2 searches
- Tracked by browser session (localStorage `ss-session-id`)
- Lasts 7 days from first usage
- After trial expires, users must join to continue

## Testing the Application Form

After running the migration:

```bash
# Test the apply endpoint
curl -X POST http://localhost:5181/api/membership/apply \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "full_name": "Test User",
    "phone": "555-1234",
    "message": "I want to join!"
  }'

# Should return:
# {"success":true,"application":{...},"message":"Application submitted successfully!"}
```

## Granting Membership Manually (For Testing)

To test Pro features without going through the application flow:

```sql
-- Insert a test membership directly
INSERT INTO memberships (email, full_name, status, tier)
VALUES ('your-test-email@example.com', 'Test User', 'active', 'full');
```

Then in the browser console:
```javascript
localStorage.setItem('strainspotter_membership', 'pro');
```

Refresh the page and Pro features should be unlocked.

## Auth Integration (Optional Future Enhancement)

Currently the system works without authentication:
- Applications use email as identifier
- Sessions tracked by browser fingerprint
- Pro gating checks localStorage

To add full auth:
1. Enable Supabase Auth in dashboard
2. Add sign-in/sign-up to frontend
3. Link `memberships.user_id` to `auth.users`
4. Update middleware to check DB membership instead of localStorage

## Environment Variables Required

Make sure these are set in `env/.env.local`:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Required for backend writes
```

## Troubleshooting

**Error: "Could not find the table 'membership_applications'"**
- The migration hasn't been run yet
- Follow Option 1 or Option 2 above to create tables

**Application form does nothing**
- Check browser console for errors
- Verify backend is running on port 5181
- Check `SUPABASE_SERVICE_ROLE_KEY` is set

**Pro features still gated after joining**
- The frontend currently uses localStorage for Pro checks
- Manual override: `localStorage.setItem('strainspotter_membership', 'pro')`
- Proper flow: Admin approves → user gets email → user logs in → membership active

## Next Steps

1. Run the migration in Supabase SQL Editor
2. Test the application form at `/membership-join`
3. Set up admin access to approve applications
4. (Optional) Add email notifications for approved members
5. (Optional) Integrate Supabase Auth for full user management
