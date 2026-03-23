# OhmerEats 🍔

A fully free, personal food ordering and delivery tracking platform — like Grab/FoodPanda but $0/month.

**Stack:** Next.js 15 · Supabase · Leaflet.js · Gmail SMTP · Vercel  
**Cost:** $0/month forever

---

## Features

- Customers browse restaurants and place orders (no login needed)
- Real-time order tracking with live rider GPS map (Leaflet + OpenStreetMap)
- Email notifications at every order step (Gmail SMTP)
- Restaurant admin dashboard — accept orders, manage menu
- Rider app — share live location, mark delivered
- Super Admin panel — manage restaurants and riders
- Cash on delivery — no payment gateway needed

---

## Quick Start

```bash
git clone https://github.com/Tech-Ohmer/food-app.git
cd food-app
npm install
cp .env.example .env.local
# Fill in .env.local then:
npm run dev
```

Open **http://localhost:3000**

---

## Pages

| Route | Who | Description |
|---|---|---|
| `/` | Anyone | Browse restaurants |
| `/restaurant/[slug]` | Anyone | View menu + add to cart |
| `/restaurant/[slug]/checkout` | Anyone | Place order |
| `/order/[token]` | Anyone | Track order (live map) |
| `/login` | Restaurant/Rider | Email + password login |
| `/dashboard` | Restaurant admin | Manage orders + menu |
| `/rider` | Rider | Current delivery + GPS sharing |
| `/admin` | Super admin (GitHub OAuth) | Manage everything |

---

## Docs

See `docs/` for full documentation:
- `docs/PROJECT.md` — Project overview and goals
- `docs/ARCHITECTURE.md` — Data model, stack decisions, routing
- `docs/SETUP_GUIDE.md` — Step-by-step setup and deployment
- `docs/CONVERSATION_LOG.md` — Full build history
- `docs/TROUBLESHOOTING.md` — Common issues and fixes
