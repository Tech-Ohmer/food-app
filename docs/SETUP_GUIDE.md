# Setup Guide — OhmerEats

How to set up OhmerEats locally and deploy to production.

**Cost:** $0  
**Last updated:** March 2026

---

## Prerequisites

- Node.js 18+ on your machine
- Personal GitHub account (Tech-Ohmer)
- Gmail account (ohmersulit@gmail.com)
- Supabase account (free)
- Vercel account (free)

---

## Step 1 — Clone and Install

```bash
git clone https://github.com/Tech-Ohmer/food-app.git
cd food-app
npm install
```

---

## Step 2 — Supabase Setup

1. Go to **https://supabase.com** → create/log in to your account
2. Create a new project (or reuse existing)
3. Go to **SQL Editor** → run the contents of `supabase/schema.sql`
4. Go to **Project Settings → API → Legacy anon, service_role API keys**:
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Copy **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

### Enable GitHub OAuth (for Super Admin)
1. Supabase → **Authentication → Sign In / Providers → GitHub** → Enable
2. GitHub → **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Homepage URL: `http://localhost:3000`
   - Callback URL: `https://[your-project].supabase.co/auth/v1/callback`
3. Paste Client ID + Secret into Supabase

### Configure Redirect URLs
Supabase → **Authentication → URL Configuration**:
- Site URL: `http://localhost:3000`
- Redirect URLs: `http://localhost:3000/**` and `http://localhost:3000/api/auth/callback`

---

## Step 3 — Gmail App Password

Same setup as the helpdesk project:

1. **https://myaccount.google.com/security** → Enable 2-Step Verification
2. **https://myaccount.google.com/apppasswords**
3. App name: `ohmer-eats` → Create
4. Copy the 16-character password

---

## Step 4 — Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Gmail SMTP
GMAIL_USER=ohmersulit@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=OhmerEats

# Admin
ADMIN_GITHUB_USERNAMES=tech-ohmer
ADMIN_EMAILS=ohmersulit@gmail.com

# Delivery fee (in your local currency)
DELIVERY_FEE=50
```

---

## Step 5 — Run Locally

```bash
npm run dev
```

Open **http://localhost:3000**

---

## Step 6 — Create First Restaurant

1. Go to **http://localhost:3000/admin** → sign in with GitHub
2. Click **Add Restaurant**
3. Fill in name, address, menu items
4. Set to "Open"
5. The restaurant now appears on the landing page

---

## Step 7 — Create First Rider

1. Admin → **Riders → Add Rider**
2. Enter name, email, phone
3. Rider receives email with login instructions
4. Rider logs in at `/rider`

---

## Step 8 — Deploy to Vercel

1. Push to GitHub: `git push origin main`
2. Go to **https://vercel.com** → Import `Tech-Ohmer/food-app`
3. Add all environment variables
4. Update `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Deploy

### Post-deploy
- Update Supabase redirect URLs with Vercel domain
- Update GitHub OAuth app homepage URL

---

## Common Issues

See `docs/TROUBLESHOOTING.md`
