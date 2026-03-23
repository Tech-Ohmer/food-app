# Architecture — OhmerEats

Technical reference for the entire project.

**Last updated:** March 2026

---

## Stack

| Layer | Technology | Why |
|---|---|---|
| Framework | Next.js 15 (App Router) | Full-stack, Server Actions, no separate backend |
| Language | TypeScript | Type safety |
| Database | Supabase (PostgreSQL) | Free tier, real-time built-in, auth built-in |
| Real-time | Supabase Realtime | Live order updates + rider GPS tracking |
| Maps | Leaflet.js + OpenStreetMap | 100% free, no API key, no credit card |
| Auth | Supabase Auth | Email/password for restaurant + rider, GitHub OAuth for super admin |
| Email | Gmail SMTP + Nodemailer | Free, sends to any email, no domain needed |
| Styling | Tailwind CSS v4 | Utility-first, fast |
| Hosting | Vercel | Free, auto-deploys from GitHub |

---

## Database Schema

### `restaurants`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| name | TEXT | Restaurant name |
| slug | TEXT (UNIQUE) | URL-friendly name (e.g. `jollibee-manila`) |
| description | TEXT | Short description |
| address | TEXT | Full address |
| phone | TEXT | Contact number |
| owner_email | TEXT | Restaurant admin email |
| logo_url | TEXT | Logo image URL |
| cover_url | TEXT | Cover/banner image URL |
| is_open | BOOLEAN | Whether restaurant is accepting orders |
| is_active | BOOLEAN | Whether restaurant is enabled by super admin |
| created_at | TIMESTAMPTZ | Auto-set |

### `menu_categories`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| restaurant_id | UUID (FK) | Which restaurant |
| name | TEXT | Category name (e.g. "Burgers", "Drinks") |
| sort_order | INT | Display order |

### `menu_items`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| restaurant_id | UUID (FK) | Which restaurant |
| category_id | UUID (FK) | Which category |
| name | TEXT | Item name |
| description | TEXT | Item description |
| price | DECIMAL | Price |
| image_url | TEXT | Item photo URL |
| is_available | BOOLEAN | Whether item can be ordered |
| sort_order | INT | Display order |

### `riders`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| user_id | UUID (FK → auth.users) | Supabase auth user |
| name | TEXT | Full name |
| phone | TEXT | Contact number |
| is_available | BOOLEAN | Available for delivery |
| is_active | BOOLEAN | Enabled by admin |
| current_lat | DECIMAL | Current GPS latitude |
| current_lng | DECIMAL | Current GPS longitude |
| last_seen_at | TIMESTAMPTZ | Last location update |

### `orders`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| order_number | TEXT (UNIQUE) | Human-readable: ORD-0001 |
| restaurant_id | UUID (FK) | Which restaurant |
| rider_id | UUID (FK, nullable) | Assigned rider |
| customer_name | TEXT | Customer name |
| customer_email | TEXT | Customer email (for notifications) |
| customer_phone | TEXT | Customer phone |
| delivery_address | TEXT | Delivery address |
| delivery_lat | DECIMAL | Delivery GPS latitude (optional) |
| delivery_lng | DECIMAL | Delivery GPS longitude (optional) |
| notes | TEXT | Special instructions |
| status | TEXT | See Order Status below |
| subtotal | DECIMAL | Items total |
| delivery_fee | DECIMAL | Delivery fee |
| total | DECIMAL | Grand total |
| tracking_token | TEXT (UNIQUE) | Public tracking URL token |
| created_at | TIMESTAMPTZ | Auto-set |
| updated_at | TIMESTAMPTZ | Auto-updated |

### `order_items`
| Column | Type | Description |
|---|---|---|
| id | UUID (PK) | Auto-generated |
| order_id | UUID (FK) | Which order |
| menu_item_id | UUID (FK) | Which menu item |
| name | TEXT | Item name (snapshot at time of order) |
| price | DECIMAL | Price (snapshot at time of order) |
| quantity | INT | How many |
| subtotal | DECIMAL | price × quantity |

---

## Order Status Flow

```
pending          → Customer placed order, waiting for restaurant
accepted         → Restaurant confirmed the order
rejected         → Restaurant rejected (out of stock, closed, etc.)
preparing        → Kitchen is making the food
ready_for_pickup → Food ready, waiting for rider
out_for_delivery → Rider picked up, on the way
delivered        → Order completed
cancelled        → Cancelled after acceptance
```

---

## Auth Roles

| Role | Method | How |
|---|---|---|
| Customer | None | No login — name, email, phone on checkout |
| Restaurant Admin | Email + password | Supabase Auth, invited by super admin |
| Rider | Email + password | Supabase Auth, created by super admin |
| Super Admin | GitHub OAuth | ADMIN_GITHUB_USERNAMES=tech-ohmer env var |

---

## Routing Map

### Public (no login)
| Route | Description |
|---|---|
| `/` | Landing page — list of open restaurants |
| `/restaurant/[slug]` | Restaurant menu |
| `/restaurant/[slug]/checkout` | Place order form |
| `/order/[token]` | Customer order tracking (live map) |
| `/login` | Login page (restaurant admin + rider) |

### Restaurant Admin (email/password login)
| Route | Description |
|---|---|
| `/dashboard` | Incoming orders + order management |
| `/dashboard/menu` | Menu management (add/edit/remove items) |
| `/dashboard/settings` | Restaurant settings (hours, info) |

### Rider (email/password login)
| Route | Description |
|---|---|
| `/rider` | Current assigned order + GPS sharing |

### Super Admin (GitHub OAuth)
| Route | Description |
|---|---|
| `/admin` | Overview dashboard |
| `/admin/restaurants` | Manage all restaurants |
| `/admin/riders` | Manage all riders |
| `/admin/orders` | View all orders |

---

## Real-time Architecture

### Rider GPS Tracking
1. Rider opens `/rider` on their phone
2. Browser Geolocation API gets GPS coordinates every 5 seconds
3. Coordinates sent to Supabase → updates `riders.current_lat` and `riders.current_lng`
4. Customer tracking page subscribes to Supabase Realtime on `riders` table
5. Map updates rider marker position in real-time

### Order Status Updates
1. Restaurant/rider changes order status
2. Supabase Realtime broadcasts change to all subscribers on `orders` table
3. Customer tracking page shows updated status instantly

---

## Email Notifications

| Trigger | Recipient | Content |
|---|---|---|
| Order placed | Customer | Confirmation + tracking link |
| Order placed | Restaurant | New order alert |
| Order accepted | Customer | "Your order is confirmed" |
| Order preparing | Customer | "Kitchen is preparing your food" |
| Order out for delivery | Customer | "Your rider is on the way" |
| Order delivered | Customer | "Your order has been delivered" |
| Order rejected | Customer | "Your order was rejected" |

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Gmail SMTP
GMAIL_USER=
GMAIL_APP_PASSWORD=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
APP_NAME=OhmerEats

# Admin access
ADMIN_GITHUB_USERNAMES=tech-ohmer
ADMIN_EMAILS=ohmersulit@gmail.com

# Delivery fee (in PHP or your currency)
DELIVERY_FEE=50
```

---

## File Structure

```
C:\Users\OhmerSulit\Projects\food-app\
├── src/
│   ├── middleware.ts                    # Route protection
│   ├── types/index.ts                   # All TypeScript types
│   ├── lib/
│   │   ├── utils.ts                     # cn(), formatDate(), formatCurrency()
│   │   ├── email.ts                     # Gmail SMTP notifications
│   │   └── supabase/
│   │       ├── client.ts               # Browser client
│   │       ├── server.ts               # Server + service role client
│   │       └── middleware.ts           # Session refresh
│   ├── app/
│   │   ├── layout.tsx                  # Root layout
│   │   ├── page.tsx                    # Landing — restaurant list
│   │   ├── login/page.tsx              # Login (restaurant + rider)
│   │   ├── unauthorized/page.tsx       # Access denied
│   │   ├── restaurant/
│   │   │   └── [slug]/
│   │   │       ├── page.tsx            # Menu page
│   │   │       └── checkout/page.tsx   # Order form
│   │   ├── order/
│   │   │   └── [token]/page.tsx        # Customer tracking (live map)
│   │   ├── dashboard/                  # Restaurant admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx               # Orders
│   │   │   ├── menu/page.tsx          # Menu management
│   │   │   └── settings/page.tsx      # Restaurant settings
│   │   ├── rider/                      # Rider app
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx
│   │   ├── admin/                      # Super admin
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── restaurants/page.tsx
│   │   │   └── riders/page.tsx
│   │   └── api/
│   │       └── auth/
│   │           ├── login/route.ts
│   │           ├── callback/route.ts
│   │           └── logout/route.ts
│   ├── components/
│   │   ├── customer/
│   │   │   ├── RestaurantCard.tsx
│   │   │   ├── MenuCard.tsx
│   │   │   ├── CartSidebar.tsx
│   │   │   ├── OrderTracker.tsx
│   │   │   └── LiveMap.tsx            # Leaflet map component
│   │   ├── dashboard/
│   │   │   ├── OrderCard.tsx
│   │   │   └── MenuEditor.tsx
│   │   ├── rider/
│   │   │   ├── DeliveryCard.tsx
│   │   │   └── LocationSharer.tsx     # GPS sharing component
│   │   └── admin/
│   │       ├── RestaurantList.tsx
│   │       └── RiderList.tsx
│   └── actions/
│       ├── orders.ts                   # Server Actions for orders
│       ├── menu.ts                     # Server Actions for menu
│       └── riders.ts                   # Server Actions for riders
├── supabase/
│   └── schema.sql                      # Full database schema
├── docs/
│   ├── PROJECT.md                      # Project overview (this file's sibling)
│   ├── ARCHITECTURE.md                 # This file
│   ├── SETUP_GUIDE.md                  # How to set up locally and deploy
│   ├── CONVERSATION_LOG.md             # Full session history
│   └── TROUBLESHOOTING.md             # Known issues and fixes
├── .env.example                        # Environment variable template
└── README.md                           # Quick start
```
