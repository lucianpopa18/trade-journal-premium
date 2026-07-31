# SKRTZ Trading Journal

Dark-mode trading journal built with React + Vite.

## What is new in this version
- iPhone-first responsive layout
- Bottom mobile navigation with thumb-friendly buttons
- Floating Add Trade button on mobile
- Sticky mobile header with blur/glass effect
- iOS safe-area support for notch and home indicator
- Input font sizing optimized to avoid iPhone zoom
- Horizontal stat cards on small screens
- Desktop sidebar preserved for PC usage
- Improved card spacing, touch targets and calendar scaling

## Features
- Dashboard with PnL, win rate, profit factor, RR, drawdown and discipline score
- Trade Plan Watchlist with entry zones, confirmation and invalidation rules, expiry and checklist
- Watchlist lifecycle: Watching, Ready, Executed, Skipped, Invalidated and Expired
- One-action Watchlist → Trading Journal prefill with plan-to-trade traceability
- Add trades with symbol, direction, session, entry, SL, TP, risk, lot, emotion, setup and notes
- Local browser storage persistence (trade/watchlist metadata in localStorage, screenshots in IndexedDB)
- JSON backup/import includes settings, trades, watchlist plans and screenshots
- Analytics by session, setup and emotion
- Calendar heatmap
- AI coach-style insights
- Mobile and desktop responsive UI

## Run locally
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Publish to GitHub
```bash
git init
git add .
git commit -m "Initial SKRTZ trading journal"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

## Deploy options
- Vercel
- Netlify
- GitHub Pages with Vite configuration
