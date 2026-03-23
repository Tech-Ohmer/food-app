# Troubleshooting — OhmerEats

Known issues and fixes — updated with all bugs found during live testing.

**Last updated:** March 23, 2026

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

---

## Cart "Add" button does nothing

**Cause:** The `MenuItemCard` component was a Server Component — it had no onClick handlers and could not dispatch events.

**Fix:** A separate `AddToCartButton` client component was created (`src/components/customer/AddToCartButton.tsx`) that dispatches the `add-to-cart` custom event when clicked. The button also gives visual feedback ("✓ Added" for 800ms).

---

## Checkout page shows "Your cart is empty"

**Cause:** The checkout page was reading from localStorage keys `cart_${slug}` and `restaurant_${slug}`, but `CartSidebar` saves to `ohmer-eats-cart` and `ohmer-eats-restaurant`. Key mismatch.

**Fix:** Updated checkout page to use the correct keys matching CartSidebar.

---

## Build error: `ssr: false` is not allowed in Server Components

**Error message:**
```
`ssr: false` is not allowed with `next/dynamic` in Server Components.
Please move it into a Client Component.
```

**File:** `src/app/order/[token]/page.tsx`

**Fix:** Removed the `dynamic` import from the server component. The `OrderTracker` client component already handles the `LiveMap` dynamic import with `ssr: false` internally. Just import and use `OrderTracker` directly.

---

## "Accept Order" button fails — "Failed to update order status"

**Root causes (two issues combined):**

1. **Missing Supabase UPDATE RLS policy** — The `orders` table had INSERT and SELECT policies but no UPDATE policy. Even though `createServiceClient()` uses the service role key (which bypasses RLS), if the key was misconfigured, updates would fail.

2. **`.select().single()` after UPDATE** — The original code chained `.select().single()` after the update. If the SELECT returned nothing (due to RLS or empty result), it threw a false error even though the update succeeded.

**Fix applied:**

1. Added UPDATE policies to Supabase via SQL Editor:
```sql
create policy "Authenticated users can update orders"
  on orders for update using (true) with check (true);

create policy "Authenticated users can update riders"
  on riders for update using (true) with check (true);
```

2. Refactored `updateOrderStatus` in `src/app/actions/orders.ts`:
- Separated the UPDATE from the SELECT
- Only update the status (no chained select)
- Fetch the order separately for email notification (non-blocking)
- Return actual Supabase error message on failure

---

## Admin cannot add riders via the UI

**Current state:** The Riders page has a "+ Add Rider" button but creating a rider requires creating a Supabase Auth user with the service role admin API.

**How to add a rider manually (current workaround):**
1. Supabase → **Authentication → Users → Add user** → enter rider email + password
2. Copy the user's UUID from the Users list
3. Supabase → **Table Editor → riders** → Insert a new row with `user_id` = the UUID, plus name and phone
4. The rider can now log in at `/login` with their email/password and access `/rider`

---

## Vercel deployment says "Deployment canceled" but still shows

**Cause:** Vercel auto-deploys when you push to GitHub. A previous manual deploy attempt was canceled, but the auto-deploy from the GitHub push succeeded.

**Fix:** Check the Deployments list — the green "Ready" entry is what's live. Ignore the canceled one.
