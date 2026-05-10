# Frontend Cookbook

## Overview
React 19 + TypeScript SPA with Vite, Tailwind CSS v4, Zustand, and Framer Motion.

## Setup
```bash
cd frontend
npm install
```

## Running
```bash
npm run dev      # Dev server on port 5173
npm run build    # Production build
npm run preview  # Preview production build
```

## Project Structure
```
frontend/src/
├── main.tsx           # Entry point
├── App.tsx            # Path-based router
├── index.css          # Tailwind + design tokens
├── components/
│   └── Layout.tsx     # Sidebar + main content shell
├── views/
│   ├── Dashboard.tsx  # Intake list + stats
│   ├── Intake.tsx     # New intake form
│   └── PublicBrief.tsx # Client-facing brief
└── store/
    ├── useAuthStore.ts    # Auth (stub)
    └── useIntakeStore.ts  # Intake + SSE
```

## Routes

| Path | View |
|------|------|
| `/` | Dashboard |
| `/intake/new` | New Intake Form |
| `/public/brief/:token` | Public Brief (no layout) |

## State Management
- **Zustand** for global state (no Redux boilerplate)
- `useIntakeStore`: manages form state, submission, and SSE events
- `useAuthStore`: stub — auto-authenticated demo user

## Design System
- **Colors**: Custom surface/brand/accent palette in `index.css`
- **Effects**: Glassmorphism (`.glass`), gradients, glow effects
- **Animations**: Framer Motion page transitions, hover effects
- **Fonts**: Inter (UI) + JetBrains Mono (code)
