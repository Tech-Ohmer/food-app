# OhmerEats — Project Overview

A fully free, personal food ordering and delivery tracking platform inspired by Grab and FoodPanda.

**Owner:** Ohmer Sulit (personal project — not related to HelloFresh or Helloconnect)  
**Started:** March 2026  
**Stack:** Next.js 15 + Supabase + Leaflet.js + Gmail SMTP + Vercel  
**Cost:** $0/month

---

## What It Does

OhmerEats lets customers browse restaurants, place orders, and track their delivery in real-time on a live map — all for free.

---

## The 4 User Types

| User | Login | Can Do |
|---|---|---|
| **Customer** | No login needed | Browse restaurants, place order, track live on map |
| **Restaurant Admin** | Email + password | Manage menu, accept orders, update status |
| **Delivery Rider** | Email + password | See assigned orders, share live GPS location |
| **Super Admin** | GitHub OAuth (OhmerSulit) | Manage all restaurants, riders, orders |

---

## Order Flow

```
Customer places order
       ↓
Restaurant gets email alert → Accepts order
       ↓
Restaurant marks "Preparing"
       ↓
Restaurant marks "Ready for Pickup"
       ↓
Super Admin assigns a Rider
       ↓
Rider picks up → shares live GPS location
       ↓
Customer sees rider moving on live map
       ↓
Rider marks "Delivered"
       ↓
Customer receives confirmation email
```

---

## Build Phases

| Phase | What | Status |
|---|---|---|
| Phase 1 | Customer ordering + Restaurant dashboard + Email notifications | In progress |
| Phase 2 | Rider app + Order assignment + Status updates | Pending |
| Phase 3 | Live GPS map tracking (Leaflet + Supabase Realtime) | Pending |
| Phase 4 | Super Admin panel (manage everything) | Pending |

---

## Key Decisions

| Decision | Choice | Reason |
|---|---|---|
| Map | Leaflet.js + OpenStreetMap | 100% free, no API key, no credit card |
| Real-time | Supabase Realtime | Free, built into Supabase, WebSocket |
| Email | Gmail SMTP + Nodemailer | Free, no domain, any recipient |
| Payment | Cash on delivery only | Keeps it free, no payment gateway needed |
| Auth | Supabase Auth (email/pass + GitHub OAuth) | Free, supports multiple roles |
| Hosting | Vercel | Free, auto-deploys from GitHub |

---

## URLs

| Environment | URL |
|---|---|
| Local | http://localhost:3000 |
| Live (after deploy) | TBD — Vercel URL |
| GitHub | https://github.com/Tech-Ohmer/food-app |

---

## Important Notes

- This is a **personal project** — not related to HelloFresh, Helloconnect, or FusionKitchen
- All files stored at: `C:\Users\OhmerSulit\Projects\food-app`
- GitHub: personal account (Tech-Ohmer), not HelloFresh org
- Do NOT use Jira, FusionKitchen repo, or any work tools for this project
