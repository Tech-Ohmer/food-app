# Conversation Log — OhmerEats

Full record of all sessions that built this project.

**Owner:** Ohmer Sulit (personal project)  
**GitHub:** https://github.com/Tech-Ohmer/food-app  
**Started:** March 2026

---

# Session 1 — Planning and Scaffold

**Date:** March 2026  
**Participants:** Ohmer Sulit + OpenCode (AI agent)

---

## 1. Project Request

**Ohmer asked:** Build a free food ordering system like Grab or FoodPanda.

**Requirements confirmed:**
- All user types: customer, restaurant admin, delivery rider, super admin
- Multiple restaurants
- Real-time order tracking on map (free option)
- Cash on delivery only (no payment gateway)
- 100% free stack
- Personal project (not work-related)

---

## 2. Key Decisions Made

| Decision | Choice | Reason |
|---|---|---|
| App name | **OhmerEats** | Catchy, has Ohmer's name, similar to UberEats/GrabFood |
| Map | Leaflet.js + OpenStreetMap | 100% free, no API key, no Google Maps billing |
| Real-time | Supabase Realtime | Built into Supabase free tier |
| Payment | Cash on delivery only | Keeps everything free |
| Auth | Supabase Auth (email/pass + GitHub OAuth) | Multiple roles, free |
| Email | Gmail SMTP + Nodemailer | Same as helpdesk project, works well |
| Stack | Next.js 15 + Supabase + Vercel | Same as helpdesk, Ohmer knows it |
| Build approach | All phases, most efficient path | User said follow best approach |

---

## 3. Build Phases

| Phase | Content |
|---|---|
| Phase 1 | Customer ordering + Restaurant dashboard + Email |
| Phase 2 | Rider app + Order assignment |
| Phase 3 | Live GPS map (Leaflet + Supabase Realtime) |
| Phase 4 | Super Admin panel |

---

## 4. Project Location

- **Local:** `C:\Users\OhmerSulit\Projects\food-app`
- **GitHub:** Personal account (Tech-Ohmer), NOT HelloFresh org
- **Pattern:** Same as helpdesk project

---

## 5. Relationship to Helpdesk Project

OhmerEats is a **separate** personal project from the helpdesk (`ohms-help-desk.vercel.app`). Both are:
- Personal projects (not work)
- Under Tech-Ohmer GitHub account
- Deployed on Vercel (free)
- Using the same stack

---

---

# Session 2 — Deployment, Testing and Bug Fixes

**Date:** March 23, 2026  
**Participants:** Ohmer Sulit + OpenCode (AI agent)

---

## Supabase Setup

- Created new OhmerEats Supabase project (same Ohms_HelpDesk organization)
- Project URL: `https://hnmxebnrsiafmsaupztr.supabase.co`
- Ran `schema.sql` — all tables, triggers, RLS policies created
- Ran `seed.sql` — 2 sample restaurants with full menus added
- GitHub OAuth configured (ohmer-eats OAuth App)
- Gmail SMTP configured (existing App Password reused)

---

## Deployment to Vercel

- Deployed to Vercel as `food-app` project
- Live URL: **https://food-app-black-tau.vercel.app**
- All 11 environment variables set

---

## Bugs Found and Fixed During Testing

### Bug 1 — Build failure: `ssr: false` in Server Component
**File:** `src/app/order/[token]/page.tsx`  
**Error:** `ssr: false` is not allowed with `next/dynamic` in Server Components  
**Fix:** Removed `dynamic` import from server page, used existing `OrderTracker` client component instead

### Bug 2 — Cart "Add" button not working
**File:** `src/app/restaurant/[slug]/page.tsx`  
**Root cause:** `MenuItemCard` was a Server Component function — buttons had no onClick handlers and dispatched no events  
**Fix:** Created `src/components/customer/AddToCartButton.tsx` client component that dispatches `add-to-cart` custom event with visual feedback

### Bug 3 — Cart hidden on mobile
**Fix:** Changed layout from `hidden lg:block` to `flex-col lg:flex-row` so cart shows on all screen sizes

### Bug 4 — Checkout page showing empty cart
**Root cause:** Checkout page read from `cart_${slug}` but CartSidebar saves to `ohmer-eats-cart` (key mismatch)  
**Fix:** Updated checkout page to use correct keys (`ohmer-eats-cart`, `ohmer-eats-restaurant`)

### Bug 5 — Admin order rows not clickable
**Fix:** Made order numbers clickable links to tracking page, added `href` to Active Orders and Total Orders stat cards

### Bug 6 — No way for admin to manage orders
**Fix:** Created new `/admin/orders` page with full order details and Accept/Reject/Progress action buttons, added Orders link to admin nav

### Bug 7 — TypeScript errors in admin orders page
**Fix:** Added `as keyof typeof` type casts for `ORDER_STATUS_COLORS` and `ORDER_STATUS_LABELS`

### Bug 8 — "Accept Order" button failing silently
**Root cause:** Two issues combined:
1. Missing Supabase UPDATE RLS policy for `orders` table (no policy allowed updates)
2. `updateOrderStatus` used `.select().single()` after update — if this returned no rows, it threw a false error

**Fix 1:** Added Supabase RLS UPDATE policies:
```sql
create policy "Authenticated users can update orders" on orders for update using (true) with check (true);
create policy "Authenticated users can update riders" on riders for update using (true) with check (true);
```

**Fix 2:** Refactored `updateOrderStatus` to:
- Update status only (no `.select()` after update)
- Fetch order separately for email notification
- Return actual Supabase error message instead of generic one
- Use `window.location.reload()` after success for reliable page refresh

---

## Git Commit History (Session 2)

| Commit | Description |
|---|---|
| `d288cdc` | feat: add sample seed data and fix login page GitHub button |
| `aa62893` | fix: move LiveMap dynamic import to client component for production build |
| `b24db8f` | fix: correct localStorage keys in checkout page to match CartSidebar |
| `675a29b` | feat: add Orders management page, clickable order rows, and order action buttons for admin |
| `6662e29` | fix: TypeScript cast in admin orders page |
| `416ccfd` | fix: improve order action button with error display and page reload |
| `a560dfb` | fix: simplify updateOrderStatus to avoid select after update and return actual error |

---

## Current Status (End of Session 2)

| Feature | Status |
|---|---|
| Landing page (2 restaurants) | ✓ Live |
| Menu browsing | ✓ Live |
| Cart (add/remove/update) | ✓ Live |
| Checkout form | ✓ Live |
| Order placement | ✓ Live |
| Order tracking page | ✓ Live |
| Email notifications | ✓ Live (Gmail SMTP) |
| Admin dashboard | ✓ Live |
| Admin orders management | ✓ Live (Accept/Reject/Progress) |
| Kanban board | ✓ Live |
| Rider app | ✓ Live |
| Live GPS map | ✓ Live |
| GitHub OAuth (admin login) | ✓ Live |

---

## Next Session Hints

If continuing this project in a future session:

- **Project is at:** `C:\Users\OhmerSulit\Projects\food-app`
- **Live URL:** `https://food-app-black-tau.vercel.app`
- **GitHub:** `https://github.com/Tech-Ohmer/food-app`
- **Supabase project:** `hnmxebnrsiafmsaupztr` (OhmerEats project in Ohms_HelpDesk org)
- **Admin login:** GitHub OAuth → `tech-ohmer` account
- **Email:** Gmail SMTP via `GMAIL_USER=ohmersulit@gmail.com`
- **Admin env vars:** `ADMIN_GITHUB_USERNAMES=tech-ohmer`, `ADMIN_EMAILS=ohmersulit@gmail.com`
- **All docs:** `C:\Users\OhmerSulit\Projects\food-app\docs\`
- **Seed data already in DB:** Ohmer's Burger House + Manila Munchies
- **Related project:** Helpdesk at `https://ohms-help-desk.vercel.app`
- **Do NOT use:** HelloFresh GitHub, FusionKitchen, Jira, or work tools
- **Next things to consider:** Add restaurant admin user to Supabase, create rider account for GPS testing
