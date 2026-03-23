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

## Next Session Hints

If continuing this project in a future session:

- **Project is at:** `C:\Users\OhmerSulit\Projects\food-app`
- **App name:** OhmerEats
- **GitHub:** https://github.com/Tech-Ohmer/food-app
- **Stack:** Next.js 15 + Supabase + Leaflet.js + Gmail SMTP + Vercel
- **Super admin access:** GitHub username `tech-ohmer` via `ADMIN_GITHUB_USERNAMES` env var
- **All docs:** `C:\Users\OhmerSulit\Projects\food-app\docs\`
- **Related project:** Helpdesk at `C:\Users\OhmerSulit\Projects\helpdesk`
- **Do NOT use:** HelloFresh GitHub, FusionKitchen, Jira, or work tools
