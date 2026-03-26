# OhmerEats — Complete Project Wiki

> A fully free, open food ordering and delivery platform built with modern web technologies.
> Inspired by Grab and FoodPanda — but costs $0/month to run.

**Live Demo:** https://food-app-black-tau.vercel.app  
**GitHub:** https://github.com/Tech-Ohmer/food-app  
**Built by:** Ohmer Sulit

---

## Table of Contents

1. [What is OhmerEats?](#what-is-ohmereats)
2. [Tech Stack](#tech-stack)
3. [Architecture Overview](#architecture-overview)
4. [User Roles](#user-roles)
5. [Full Order Flow](#full-order-flow)
6. [Database Schema](#database-schema)
7. [All Pages & Routes](#all-pages--routes)
8. [Setup from Scratch](#setup-from-scratch)
9. [Environment Variables](#environment-variables)
10. [API Routes Reference](#api-routes-reference)
11. [Remittance System](#remittance-system)
12. [Free Tier Limits](#free-tier-limits)
13. [Known Issues & Fixes](#known-issues--fixes)
14. [Contributing](#contributing)

---

## What is OhmerEats?

OhmerEats is a complete food delivery platform with:
- **Multiple restaurants** on one platform
- **Customer ordering** with cart, checkout, real-time tracking
- **Live GPS map** — customers see the rider moving toward them
- **Restaurant dashboard** — manage orders, menu items, availability
- **Rider app** — claim orders, share GPS, log remittances
- **Super Admin** — manage everything, view remittances, handle overdue alerts
- **Email notifications** at every step of the order journey
- **Remittance tracking** — riders log payments to restaurants with cutoff rules

**Monthly cost: $0** — built entirely on free tiers.

---

## Tech Stack

| Layer | Technology | Why Free |
|---|---|---|
| **Framework** | Next.js 15 (App Router) | Open source |
| **Database** | Supabase PostgreSQL | 500MB free tier |
| **Auth** | Supabase Auth + GitHub OAuth | Free tier |
| **Real-time** | Supabase Realtime | Included in free tier |
| **Maps** | Leaflet.js + OpenStreetMap | 100% free, no API key |
| **Email** | Gmail SMTP + Nodemailer | 500 emails/day free |
| **Hosting** | Vercel Hobby | Free tier |
| **Cron Jobs** | Vercel Cron | Free on Hobby plan |
| **Code hosting** | GitHub | Free |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                      VERCEL (Hosting)                    │
│                                                          │
│  Next.js 15 App Router                                   │
│  ├── /                  Customer: browse restaurants     │
│  ├── /restaurant/[slug] Customer: menu + cart            │
│  ├── /order/[token]     Customer: live tracking + map    │
│  ├── /login             Restaurant/Rider login           │
│  ├── /dashboard         Restaurant admin                 │
│  ├── /rider             Rider app                       │
│  └── /admin             Super admin panel               │
│                                                          │
│  Server Actions (bypass RLS via raw Supabase client)     │
│  API Routes (admin operations)                          │
│  Cron Job (daily overdue check)                          │
└─────────────────────────────────────────────────────────┘
         │                              │
         ▼                              ▼
┌─────────────┐              ┌──────────────────┐
│  Supabase   │              │   Gmail SMTP     │
│  PostgreSQL │              │   (Nodemailer)   │
│  Auth       │              │                  │
│  Realtime   │              │  Sends emails to │
│             │              │  anyone, free    │
└─────────────┘              └──────────────────┘
         │
         ▼
┌─────────────────┐
│ Leaflet.js +    │
│ OpenStreetMap   │
│ (free maps,     │
│  no API key)    │
└─────────────────┘
```

---

## User Roles

### 1. Customer (no login required)
- Browse restaurants
- View menus and add items to cart
- Place orders with delivery details
- Track order in real-time on a live map
- Receive email notifications at each stage

### 2. Restaurant Admin (email + password login)
- Accept or reject incoming orders
- Update order status (Preparing → Ready)
- Manage menu items (add, edit, hide, delete)
- Open/close restaurant
- View remittance status for all delivered orders
- Set remittance cutoff rules

### 3. Rider (email + password login)
- Browse all available orders (any restaurant)
- Claim an order (first come, first served)
- Confirm pickup — triggers live GPS sharing
- Share live GPS location (customer sees map update)
- Mark order as delivered
- Log remittance to restaurant (full or partial)
- View earnings summary

### 4. Super Admin (GitHub OAuth login)
- Manage all restaurants (add, edit, deactivate, delete)
- Manage all riders (add, edit, toggle availability, delete)
- View all orders across all restaurants
- Override rider earnings per order
- View remittance overview — all riders, all statuses
- Receive overdue remittance alerts

---

## Full Order Flow

```
STEP 1 — Customer orders
  Customer → selects restaurant → adds items to cart
  → fills delivery details → places order
  Status: PENDING

STEP 2 — Restaurant accepts
  Restaurant sees order in dashboard (email + real-time)
  → clicks Accept Order
  Status: ACCEPTED → PREPARING

STEP 3 — Restaurant marks ready
  Restaurant finishes preparing
  → clicks "Mark Ready for Pickup"
  Status: READY_FOR_PICKUP
  → All riders see this order in their "Available Orders" tab

STEP 4 — Rider claims order (NEW in v3.0)
  Rider sees order in their Available Orders list
  → clicks "Accept Delivery"
  → order locked to that rider (database prevents double-claiming)
  Status: RIDER_CLAIMED
  → Restaurant, Admin, Customer notified in real-time + email

STEP 5 — Rider picks up
  Rider arrives at restaurant, picks up food
  → clicks "Confirm Pickup"
  Status: OUT_FOR_DELIVERY
  → Customer notified: "Your order is on the way!"
  → Live GPS map appears on customer's tracking page

STEP 6 — Rider delivers
  Rider arrives at customer address
  → Customer pays cash (total amount)
  → Rider clicks "Mark as Delivered"
  Status: DELIVERED
  → System computes:
      Rider keeps: ₱50 (delivery fee)
      Rider must remit: ₱377 (food subtotal) to restaurant

STEP 7 — Remittance
  Rider goes to restaurant → hands over ₱377
  → Logs remittance in app (full or partial)
  → Restaurant confirms receipt
  → All views updated: Admin + Restaurant + Rider
  
  If not remitted by cutoff date:
  → Day 3: Admin + Restaurant receive overdue email alert
  → Order flagged as OVERDUE in all views
```

---

## Database Schema

### `restaurants`
```
id, name, slug, description, address, phone, owner_email
logo_url, cover_url, is_open, is_active
remittance_rule (per_delivery|daily|weekly|custom)
remittance_days (default: 1)
created_at, updated_at
```

### `menu_categories`
```
id, restaurant_id, name, sort_order
```

### `menu_items`
```
id, restaurant_id, category_id, name, description
price, image_url, is_available, sort_order, created_at
```

### `riders`
```
id, user_id, name, phone
is_available, is_active
current_lat, current_lng, last_seen_at
created_at
```

### `orders`
```
id, order_number (TKT-0001), restaurant_id, rider_id
customer_name, customer_email, customer_phone
delivery_address, delivery_lat, delivery_lng, notes
status (pending|accepted|rejected|preparing|ready_for_pickup|
        rider_claimed|out_for_delivery|delivered|cancelled)
subtotal, delivery_fee, total, tracking_token
-- Remittance fields (v3.0):
rider_earnings, restaurant_amount
remit_status (pending|partial|full|overdue)
amount_remitted, remit_due_date, remit_notes
created_at, updated_at
```

### `order_items`
```
id, order_id, menu_item_id, name, price, quantity, subtotal
```

### `remittance_logs` (v3.0 new)
```
id, order_id, rider_id
amount, remit_type (partial|full), notes
created_at
```

---

## All Pages & Routes

### Public (no login)
| Route | Description |
|---|---|
| `/` | Restaurant listing page |
| `/restaurant/[slug]` | Menu page with cart |
| `/restaurant/[slug]/checkout` | Place order |
| `/order/[token]` | Live order tracking (GPS map) |
| `/login` | Restaurant admin + Rider login |
| `/unauthorized` | Access denied page |

### Restaurant Admin (email/password)
| Route | Description |
|---|---|
| `/dashboard` | Incoming orders + Accept/Reject/Progress |
| `/dashboard/menu` | Menu management (add/edit/hide/delete) |
| `/dashboard/remittances` | Remittance tracking + set rules (v3.0) |

### Rider (email/password)
| Route | Description |
|---|---|
| `/rider` | Available orders + Active delivery + Earnings + Remittance (v3.0) |

### Super Admin (GitHub OAuth)
| Route | Description |
|---|---|
| `/admin` | Overview dashboard |
| `/admin/orders` | All orders with remittance status |
| `/admin/restaurants` | Manage restaurants |
| `/admin/restaurants/new` | Add restaurant |
| `/admin/restaurants/[id]/edit` | Edit restaurant |
| `/admin/riders` | Manage riders + assign orders |
| `/admin/remittances` | All remittance overview (v3.0) |

---

## Setup from Scratch

### Prerequisites
- Node.js 18+
- Git + GitHub account (personal)
- Gmail account
- Supabase account (free)
- Vercel account (free)

### Step 1 — Clone and install
```bash
git clone https://github.com/Tech-Ohmer/food-app.git
cd food-app
npm install
```

### Step 2 — Supabase setup
1. Create a free project at https://supabase.com
2. Go to SQL Editor → run `supabase/schema.sql`
3. Run `supabase/migration_v2.sql` (for v3.0 features)
4. Go to Settings → API → copy URL + Legacy anon/service_role keys

### Step 3 — Enable GitHub OAuth
1. Supabase → Authentication → Providers → GitHub → Enable
2. GitHub → Settings → Developer Settings → New OAuth App
3. Callback URL: `https://[your-project].supabase.co/auth/v1/callback`
4. Paste Client ID + Secret → Save

### Step 4 — Gmail App Password
1. Google Account → Security → 2-Step Verification (enable)
2. Google Account → App Passwords → Create `ohmereats`
3. Copy the 16-character password

### Step 5 — Environment variables
```bash
cp .env.example .env.local
```
Fill in `.env.local` (see Environment Variables section below)

### Step 6 — Run locally
```bash
npm run dev
```
Open http://localhost:3000

### Step 7 — Deploy to Vercel
1. Push to GitHub
2. Vercel → Import `food-app` repo
3. Add all environment variables
4. Set `NEXT_PUBLIC_APP_URL` to your Vercel URL
5. Deploy

---

## Environment Variables

```env
# Supabase (use Legacy anon/service_role keys)
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# Gmail SMTP
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=OhmerEats

# Admin access (GitHub OAuth whitelist)
ADMIN_GITHUB_USERNAMES=your-github-username
ADMIN_EMAILS=your_email@gmail.com
ADMIN_EMAIL=your_email@gmail.com

# Delivery fee (default, in PHP)
DELIVERY_FEE=50
```

---

## API Routes Reference

### Admin — Restaurants
| Method | Route | Description |
|---|---|---|
| GET | `/api/admin/restaurants` | List all restaurants |
| POST | `/api/admin/restaurants` | Create restaurant |
| GET | `/api/admin/restaurants/[id]` | Get restaurant |
| PATCH | `/api/admin/restaurants/[id]` | Update restaurant |
| DELETE | `/api/admin/restaurants/[id]` | Delete restaurant |

### Admin — Menu Items
| Method | Route | Description |
|---|---|---|
| POST | `/api/admin/menu` | Add menu item |
| PATCH | `/api/admin/menu/[id]` | Update menu item |
| DELETE | `/api/admin/menu/[id]` | Delete menu item |

### Admin — Riders
| Method | Route | Description |
|---|---|---|
| PATCH | `/api/admin/riders/[id]` | Update rider |
| DELETE | `/api/admin/riders/[id]` | Delete rider |

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | GitHub OAuth redirect |
| GET | `/api/auth/callback` | OAuth callback |
| POST | `/api/auth/logout` | Sign out |

### Image Search
| Method | Route | Description |
|---|---|---|
| GET | `/api/search-images?q=[term]` | Search Unsplash for food images |

### Cron (v3.0)
| Method | Route | Description |
|---|---|---|
| GET | `/api/cron/check-remittances` | Daily overdue remittance check |

---

## Remittance System

### How it works

When an order is delivered, the system computes:
```
Customer paid total:    ₱427
Rider earnings (keeps): ₱50  (= delivery_fee by default)
Restaurant amount due:  ₱377 (= subtotal — what rider must remit)
```

### Remittance rules (set per restaurant)
| Rule | Meaning |
|---|---|
| `per_delivery` | Remit after each delivery (due next day) |
| `daily` | Remit all daily deliveries by end of day |
| `weekly` | Remit all weekly deliveries by end of week |
| `custom` | Admin-defined number of days |

### Overdue system
- Day 0: Order delivered → remit_due_date calculated
- Due date: Reminder shown to rider
- Day 3 overdue: Admin + Restaurant notified via email
- Vercel Cron runs daily at midnight to check

### Remittance statuses
| Status | Meaning |
|---|---|
| `pending` | Nothing remitted yet |
| `partial` | Some amount remitted, balance remaining |
| `full` | Fully remitted |
| `overdue` | Past due date, not fully remitted |

---

## Free Tier Limits

| Service | Free Limit | OhmerEats Usage |
|---|---|---|
| Supabase DB | 500MB | ~500K orders (way more than enough) |
| Supabase Auth | 50K MAU | No practical limit for small/medium use |
| Supabase Realtime | 200 concurrent | Fine for typical use |
| Vercel Bandwidth | 100GB/month | Light app, well within limit |
| Vercel Functions | 100GB-hours/month | Well within limit |
| Vercel Cron | 2 jobs, 60 invocations/day | Using 1 job, 1 invocation/day |
| Gmail SMTP | 500 emails/day | Fine for typical restaurant use |

**Monthly cost: $0**

---

## Known Issues & Fixes

See `docs/TROUBLESHOOTING.md` for detailed solutions.

### Common issues:
1. **"new row violates RLS policy"** — Use admin API routes, not direct Supabase client
2. **GitHub OAuth 405 error** — Use HTTP 303 redirect (not 307) for POST forms
3. **Cart empty on checkout** — Ensure localStorage keys match: `ohmer-eats-cart`
4. **Server action not working** — Use `createClient()` from `@supabase/supabase-js` directly (not `createServerClient` from `@supabase/ssr`)
5. **Supabase project paused** — Free tier pauses after 7 days inactivity; wakes automatically

---

## Restaurant Account Setup

To add a new restaurant:
1. Admin → Restaurants → Add Restaurant (set owner email)
2. Supabase → Authentication → Users → Add user (same email + password)
3. Owner logs in at `/login` with email/password → lands on `/dashboard`

### Current restaurant accounts
| Restaurant | Email | Notes |
|---|---|---|
| Ohmer's Burger House | `burgers@ohmereats.com` | Created by admin |
| Manila Munchies | `munchies@ohmereats.com` | Created by admin |
| Ohmer Pizza House | `pizza@ohmereats.com` | Created by admin |

### Rider account
| Name | Email | Notes |
|---|---|---|
| Kuya Dan (Test Rider) | `rider@ohmereats.com` | Test account |

---

## Contributing

This is a personal project by Ohmer Sulit. If you're building something similar, here's what to know:

1. **All secrets go in `.env.local`** — never commit this file
2. **`/scripts/` folder is gitignored** — use it for one-off DB operations, delete after
3. **All DB writes go through admin API routes** — raw `createClient()` with service role key
4. **No breaking changes** — all new features are additive only
5. **TypeScript must be 0 errors** before any commit (`npx tsc --noEmit`)

### Stack decisions explained
- **No Resend** — free tier restricts recipients; Gmail SMTP sends to anyone
- **No Google Maps** — Leaflet + OpenStreetMap is 100% free with no API key
- **No payment gateway** — Cash on delivery keeps everything free
- **No Redis/cache** — Supabase Realtime handles live updates natively
- **Raw Supabase client in actions** — `createServerClient` from `@supabase/ssr` picks up user cookies and overrides the service role context; raw `createClient` properly bypasses RLS

---

*Last updated: March 2026*
