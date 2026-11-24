# Mofit

تطبيق ويب (PWA) بالعربي لمتابعة التمرين والتغذية بين الكوتش وعملائه.
Arabic/RTL coaching PWA: workouts, nutrition, habits, progress and check-ins.

Live: https://mofit-coaching.github.io/

## Stack
- Static site on GitHub Pages. Vanilla JS, no build step.
- Supabase for auth, Postgres and storage (`checkins` bucket).
- Service worker (`sw.js`) for offline app shell.

## Files
| File | What it does |
|---|---|
| `index.html` | shell, login, script tags |
| `core.js` | helpers, calculations, bottom sheet, rest timer, Supabase client |
| `views.js` | client app tabs (home, train, food, habits, body) |
| `coach.js` | coach dashboard, program/diet editors |
| `training.js`, `pro.js`, `lab.js`, `supps.js` | training logic, check-ins, health screens, supplements |
| `prices.js` | public prices/offers and WhatsApp links |
| `data.js`, `icons.js` | exercise/food data, icons |
| `sw.js`, `manifest.json` | offline cache and install config |

## Releasing a change
Cache-busting uses a version string (`?v=XXXXXXXX`) in `index.html` and `sw.js`, and the cache name `C` in `sw.js`.
When you change any JS/CSS file, replace the old version string with a new one in both files, so installed apps pick up the update.

## Security notes
- The Supabase key in `core.js` is the public (publishable) key. All data safety depends on Row Level Security on every table and storage bucket. See `SECURITY-CHECKLIST.md`.
- CDN scripts are pinned to exact versions with SRI hashes. When upgrading one, recompute the hash.
