# T1DTMD – carbs & insulin for type 1 diabetes

Phone app (PWA) for people with T1D who eat Punjabi and Indian food. Users log in,
add what's on their plate (home or dhaba, small/medium/large, extras like milk and chai),
and get carbs + insulin units from their own carb ratio. You manage users and monthly
subscriptions from the admin dashboard.

## Files
- `index.html` – the whole app. This is the only file you normally edit (pencil icon on GitHub).
  Sections inside: COLOURS at the top, `FIREBASE_CONFIG`, `FOOD LIST`, `APP CODE`.
- `supabase.sql` – paste into Supabase SQL Editor once (creates the tables and security).
- `sw.js`, `manifest.json`, icons – make it installable and work offline. Leave as is.

## Put it online
Upload everything to your repo → Settings → Pages → main / root → Save.
Without Supabase keys it runs in demo mode (admin / admin123, data on that phone only).

## Food list format
`[id, name, search words, category, unit, home carbs, dhaba carbs, oily 0/1]` – carbs for ONE medium portion.

## How the dose is worked out
food dose = carbs ÷ carb ratio; optional correction = (sugar − target) ÷ correction factor;
rounded to the pen step, never below 0. Below 70 mg/dL (3.9 mmol/L) it says "Low" instead of a dose.

## Important
The app only does the maths with numbers users enter. It is not a medical device and
does not replace a doctor or diabetes educator.
