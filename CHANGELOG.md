# OhmerEats — Changelog

All notable changes to OhmerEats are documented here.

**Live URL:** https://food-app-black-tau.vercel.app  
**GitHub:** https://github.com/Tech-Ohmer/food-app  
**Owner:** Ohmer Sulit (personal project)

---

## [v3.0.0] — In Progress — Rider Marketplace + Remittance System

### New Features
- **Rider Order Marketplace** — Riders can self-claim available orders without admin assignment
- **Delivery Charge System** — Auto-computed per delivery (rider keeps delivery fee, remits subtotal to restaurant)
- **Remittance Tracking** — Full/partial remittance logging per order
- **Remittance Cutoff Rules** — Each restaurant sets their own rule (per delivery / daily / weekly)
- **Overdue Alerts** — Admin + restaurant notified if rider doesn't remit within 3 days
- **Rider Earnings Summary** — Riders see their daily/total earnings
- **New Order Status: `rider_claimed`** — Between ready_for_pickup and out_for_delivery
- **Confirm Pickup** — Rider explicitly confirms pickup; customer notified in real-time
- **Vercel Cron Job** — Daily checker for overdue remittances (free on Hobby plan)

### Database Changes (Additive — no breaking changes)
- `orders` table: added `rider_earnings`, `restaurant_amount`, `remit_status`, `amount_remitted`, `remit_due_date`, `remit_notes`
- `restaurants` table: added `remittance_rule`, `remittance_days`
- New table: `remittance_logs` — tracks individual remittance transactions
- New trigger: `set_remittance_on_delivery` — auto-computes remittance amounts on delivery

### New Pages/Views
- `/rider` — Complete rework: Available Orders tab, Active Delivery tab, Earnings tab, Remittance tab
- `/dashboard` — New Remittances tab for restaurant owners
- `/admin/remittances` — Overview of all riders' remittance status

---

## [v2.5.0] — March 2026 — Full CRUD + Image System

### New Features
- **Full CRUD for Restaurants** — Create, Read, Update, Delete from admin panel
- **Full CRUD for Menu Items** — Inline edit, hide/show, delete from restaurant dashboard
- **Full CRUD for Riders** — Edit name/phone inline, toggle availability, delete
- **Separate Restaurant Logins** — Each restaurant has its own email/password account
- **Food Photos** — All menu items updated with accurate food photos
- **Filipino Food Photos** — Manila Munchies uses real Wikimedia Commons Filipino food photos
- **Image Search in Menu Editor** — "🔍 Search for image online" button using Unsplash
- **Add New Restaurant Page** — `/admin/restaurants/new` with form and API

### Bug Fixes
- Fixed RLS bypass — all server actions now use raw `createClient` (no session override)
- Fixed `dashboard/menu/page.tsx` using wrong component (`MenuManager` → `MenuEditor`)
- Fixed dashboard layout using anon client (now uses service client for RLS bypass)
- Fixed rider "Mark as Delivered" button — no feedback. Added loading + success states
- Fixed `updateOrderStatus` — separated UPDATE from SELECT to avoid false errors

### Security
- Removed exposed Supabase service role key from git history (force-pushed clean history)
- Removed exposed Gmail App Password from git history
- Added `scripts/` to `.gitignore` permanently

---

## [v2.0.0] — March 2026 — Deployment + Core Bug Fixes

### New Features
- **Deployed to Vercel** — Live at https://food-app-black-tau.vercel.app
- **Admin Orders Management page** — `/admin/orders` with Accept/Reject/Progress buttons
- **Clickable order rows** — Order numbers link to tracking page
- **Cart "Add" button** — New `AddToCartButton` client component dispatches events
- **Image search API** — `/api/search-images` using Unsplash
- **Restaurant owner accounts** — Separate email/password per restaurant

### Bug Fixes
- Fixed GitHub OAuth 405 error — changed redirect from 307 to 303 (POST → GET preservation)
- Fixed checkout page empty cart — localStorage key mismatch corrected
- Fixed Supabase GitHub OAuth — added localhost redirect URLs to URL Configuration
- Fixed `.env.local` not loading — file was named `.env` instead of `.env.local`
- Fixed 13 TypeScript build errors — all resolved before deployment
- Fixed `ssr: false` in Server Component — moved LiveMap to client component
- Fixed Supabase API keys — switched from new `sb_publishable` format to legacy `eyJ...` format

### Email System Change
- Replaced **Resend** with **Gmail SMTP + Nodemailer** — Resend free tier only sends to signup email; Gmail SMTP sends to any recipient, completely free

---

## [v1.0.0] — March 2026 — Initial Build

### Features Built
- **Customer Flow** — Browse restaurants → Menu → Cart → Checkout → Order tracking
- **Live GPS Map** — Leaflet.js + OpenStreetMap + Supabase Realtime (100% free)
- **Restaurant Admin Dashboard** — Accept orders, manage menu, open/close restaurant
- **Rider App** — See current delivery, share live GPS, mark delivered
- **Super Admin Panel** — Manage restaurants, riders, view all orders
- **Email Notifications** — Order confirmation, status updates, delivery confirmation
- **GitHub OAuth** — Admin login via GitHub (whitelisted emails/usernames)
- **Admin Whitelist** — `ADMIN_EMAILS` and `ADMIN_GITHUB_USERNAMES` env vars

### Stack
- **Framework:** Next.js 15 (App Router)
- **Database:** Supabase (PostgreSQL + Auth + Realtime)
- **Email:** Gmail SMTP + Nodemailer
- **Maps:** Leaflet.js + OpenStreetMap (free, no API key)
- **Hosting:** Vercel (Hobby plan)
- **Code:** GitHub (Tech-Ohmer/food-app)
- **Cost:** $0/month

### Seed Data
- Ohmer's Burger House (7 menu items with photos)
- Manila Munchies (7 Filipino food items with authentic Wikimedia Commons photos)

---

## Version Roadmap

| Version | Status | Description |
|---|---|---|
| v1.0.0 | ✓ Released | Core ordering platform |
| v2.0.0 | ✓ Released | Deployment + core bug fixes |
| v2.5.0 | ✓ Released | Full CRUD + image system |
| v3.0.0 | 🔨 Building | Rider marketplace + remittance |
| v3.5.0 | 📋 Planned | Push notifications |
| v4.0.0 | 📋 Planned | Analytics dashboard |
