# MacroStack — Nutrition Coaching Platform

A full-featured nutrition coaching web app for coaches and their clients. Mobile-first on all coach views, fully responsive across all screen sizes.

---

## Features

### Coach Side
- **Dashboard** — live client calorie progress, 7-day compliance tracking, goal quick-edit, bulk email compose
- **Clients** — full client management with TDEE/BMR calculator (Mifflin-St Jeor), goal setting, compliance history, and danger zone controls
- **Meal Plans** — AI-powered meal plan generation with a drag-and-drop builder
- **Chat** — real-time coach ↔ client messaging with unread badges
- **Food Database** — searchable database of 1,270+ foods with custom food entry and UPC barcode scanning

### Client Side
- **Dashboard** — daily macro ring, calorie progress bar, streak tracker
- **Food Log** — log meals by food, quantity, and meal type; barcode scanner built in
- **Weight Log** — track bodyweight over time with trend chart
- **Progress** — before/after photo uploads, measurement tracking
- **Messages** — direct messaging with coach
- **Profile** — personal details, goal display

### Barcode Scanner
- Camera-based UPC scanner using ZXing (ROI-cropped decoding)
- Auto-fetches nutrition data from Open Food Facts API
- Shared food database — scanned foods available to all users
- Duplicate detection by UPC and name/brand

---

## Tech Stack

| Layer | Library |
|---|---|
| UI | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand v5 (persisted) |
| Barcode | @zxing/library |
| Nutrition API | Open Food Facts (free, no key) |
| Date utils | date-fns |
| Icons | lucide-react |

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Production build
npm run build
```

The app runs at `http://localhost:5173` by default.

---

## Project Structure

```
src/
├── components/        # Shared components (BarcodeScanner, ScannedFoodModal, etc.)
├── data/              # Built-in food database (1,270+ foods)
├── hooks/             # useIsMobile, etc.
├── layouts/           # CoachLayout, ClientLayout
├── pages/
│   ├── coach/         # Desktop coach pages + mobile/ subdirectory
│   ├── client/        # Client-side pages
│   └── ...
├── services/          # AI meal plan generation
├── store/             # Zustand global store
└── App.jsx            # Root — auto-routes mobile vs desktop
```

---

## Mobile vs Desktop

The app auto-detects viewport width via `useIsMobile` (breakpoint: 768 px). On mobile, coach pages swap to fully optimized layouts with bottom tab navigation. Client pages are always mobile-first.
