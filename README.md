# MacroStack — Nutrition Coaching Platform

A full-featured nutrition coaching web app for coaches and their clients. Mobile-first on all coach views, fully responsive across all screen sizes.

---

## Deployment

| Service | Account / URL |
|---|---|
| **GitHub** | [muscle-mentor-programs/macrostack](https://github.com/muscle-mentor-programs/macrostack) |
| **Vercel** | Auto-deploys from `master` → [macrostack.vercel.app](https://macrostack.vercel.app) |
| **Supabase** | Project `macrostack` · ref `ryvsbidtwhxfmashwsqt` · West US (Oregon) |

> Push to `master` → Vercel picks it up automatically. No manual deploy step needed.

---

## Features

### Coach Side
- **Dashboard** — live client calorie progress, 7-day compliance tracking, goal quick-edit, bulk email compose
- **Clients** — full client management with TDEE/BMR calculator (Mifflin-St Jeor), goal setting, compliance history, and danger zone controls
- **Meal Plans** — AI-powered meal plan generation with a drag-and-drop builder
- **Chat** — real-time coach ↔ client messaging with unread badges
- **Food Database** — searchable database of 1,270+ foods with custom food entry and UPC barcode scanning

### Client Side
- **Dashboard** — daily macro ring, calorie progress bar, meal plan viewer with one-tap logging
- **Food Log** — log meals by food, quantity, and meal type; barcode scanner built in
- **Weight Log** — track bodyweight over time with 7-day moving average trend chart
- **Messages** — iMessage-style direct messaging with coach
- **Profile** — personal details, coach-assigned targets, 30-day calorie & protein progress charts

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
| State | Zustand v5 (persisted to localStorage) |
| Charts | Recharts |
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
├── components/        # Shared components (BarcodeScanner, BottomNav, etc.)
├── data/              # Built-in food database (1,270+ foods)
├── hooks/             # useIsMobile, useScramble, useCountUp
├── layouts/           # CoachLayout, ClientLayout
├── pages/
│   ├── coach/         # Desktop coach pages + mobile/ subdirectory
│   ├── client/        # Client-side pages
│   └── ...
├── services/          # AI meal plan generation
├── store/             # Zustand global store (index.js)
└── App.jsx            # Root — auto-routes mobile vs desktop, role vs client
```

---

## Mobile vs Desktop

The app auto-detects viewport width via `useIsMobile` (breakpoint: 768 px). On mobile, coach pages swap to fully optimized layouts with bottom tab navigation. Client pages are always mobile-first.

iOS-specific considerations implemented:
- `h-[100dvh]` dynamic viewport height (avoids Safari URL-bar clipping)
- `env(safe-area-inset-bottom)` for home-bar clearance on notched devices
- `fixed` bottom nav so the software keyboard slides over it rather than pushing it up
- `visualViewport` API in the chat view to ride the input bar above the keyboard in real time
- `viewport-fit=cover` + `user-scalable=no` for native app feel

---

## TODO

- [ ] **Set up Gmail SMTP for client invite emails** — Resend requires a verified domain (not yet set up). Use Gmail SMTP instead:
  1. Create/use a Gmail account (e.g. `macrostack.coach@gmail.com`)
  2. Enable 2-Step Verification on that Google account
  3. Go to **myaccount.google.com → Security → App Passwords** → generate one for Mail
  4. Supabase Dashboard → **Authentication → SMTP Settings**:
     - Host: `smtp.gmail.com` · Port: `587`
     - Username: Gmail address · Password: 16-char App Password
     - Sender email: Gmail address · Sender name: `MacroStack`
  5. Test by adding a client with an email — invite should arrive within seconds

---

## Accounts & Access

| Resource | Account |
|---|---|
| GitHub org | `muscle-mentor-programs` |
| Vercel team | `muscle-mentor-programs` |
| Supabase org | `jxyqgqtyatmdhgawxeuo` · project ref `ryvsbidtwhxfmashwsqt` |
| Contact | brandenmhales@gmail.com |
