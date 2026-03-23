# Troubleshooting — OhmerEats

Known issues and fixes.

**Last updated:** March 2026

---

## Map not showing

**Symptom:** Blank map area, no tiles loading.

**Cause:** Leaflet requires a CSS import and window object (SSR issue).

**Fix:**
- Make sure the map component uses `'use client'` directive
- Import Leaflet CSS inside the component
- Use `dynamic()` import with `{ ssr: false }` for the map component

```typescript
const LiveMap = dynamic(() => import('@/components/customer/LiveMap'), { ssr: false })
```

---

## Rider location not updating on map

**Symptom:** Map shows rider but position doesn't move.

**Cause:** Supabase Realtime subscription not set up correctly, or rider's browser denied location permission.

**Fix:**
1. Check that Supabase Realtime is enabled on the `riders` table
2. Check browser permissions — rider must allow location access
3. Verify the Supabase subscription is listening to the correct table/column

---

## Email not sending

Same as helpdesk project — see helpdesk TROUBLESHOOTING.md.

**Quick check:** Make sure `GMAIL_USER` and `GMAIL_APP_PASSWORD` are set in `.env.local` and restart `npm run dev`.

---

## Access Denied on /admin

**Cause:** GitHub account email or username not in whitelist.

**Fix:** Add `ADMIN_GITHUB_USERNAMES=tech-ohmer` and `ADMIN_EMAILS=ohmersulit@gmail.com` to Vercel env vars → Redeploy.

**Debug:** The unauthorized page shows the detected email and username. Use those exact values in the env vars.

---

## Restaurant not showing on landing page

**Cause:** Restaurant `is_open` or `is_active` is false.

**Fix:** Supabase → Table Editor → `restaurants` → set both `is_open` and `is_active` to `true`.

---

## Order tracking page shows blank map

**Cause:** Rider hasn't started sharing location yet, or `current_lat`/`current_lng` are null.

**Fix:** Rider must open `/rider` and allow location access before the map shows their position. The map only shows when coordinates exist.

---

## Supabase project paused

**Cause:** Supabase free tier pauses projects after 1 week of inactivity.

**Fix:** Log in to Supabase → the project will wake up automatically within 30 seconds. Avoid by using the app at least once a week.
