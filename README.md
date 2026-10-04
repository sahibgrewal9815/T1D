# T1DTMD – carbs & insulin for type 1 diabetes

A simple phone app (PWA) for people with T1D who eat Punjabi and Indian food.
Add what's on your plate (home-made or dhaba, small/medium/large, how many),
add extras like milk, chai or sugar, and it tells you the carbs and the insulin
units using **your own carb ratio**.

## Put it online (GitHub Pages)
1. Create a new repo, e.g. `t1dtmd`.
2. Upload every file in this folder (index.html, sw.js, manifest.json, icons). After that you only ever edit index.html.
3. Repo **Settings → Pages → Branch: main → / (root) → Save**.
4. Open `https://YOUR-NAME.github.io/t1dtmd/` on your phone → browser menu → **Add to Home Screen**.

## First time
- Enter your name and carb ratio (both live in the **User** tab) (e.g. `10` = 1 unit for every 10 g carbs).
- Settings: different ratio per meal, ½-unit pens, a correction for high sugar
  (target + correction factor from your diabetes team), a "warn me above" dose limit,
  and how long your rapid insulin works (used to warn about stacking doses).

## How the dose is worked out
```
food dose   = carbs ÷ carb ratio
correction  = (sugar now − target) ÷ correction factor   (only if turned on)
dose        = food dose + correction, rounded to your pen step (never below 0)
```
If sugar is below 70 mg/dL (3.9 mmol/L) it shows **Low** and asks you to treat
the low first instead of giving a number.

## Fixing or adding foods
- In the app: **Add my own food** (saved on the phone, included in backups).
- For everyone using your repo: edit the FOOD LIST inside `index.html` (pencil icon on GitHub). Each line is
  `[id, name, search words, category, unit, home carbs, dhaba carbs, oily 0/1]`.
  Carbs are for ONE medium portion. The app checks for a new version every time it opens online.

## Sources
ISPAD / Life for a Child, *Healthy eating and carbohydrate counting – Indian foods* (2021);
S. Salis, *Nutrition Basics and a Quick Guide to Carbohydrate Counting* (2018);
IFCT / USDA for missing items. Dhaba and home portions are estimates.

## Important
This app only does the maths with numbers you give it. It is not a medical device
and does not replace your doctor or diabetes educator. Check your sugar regularly,
weigh your usual portions once in a while, and adjust ratios only with your team.
Back up your log from the Log tab now and then: data lives only on the phone.
