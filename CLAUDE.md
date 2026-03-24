# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm i          # Install dependencies
npm run dev    # Start development server (Vite)
npm run build  # Production build
```

There are no test or lint scripts configured.

## Architecture

**Canto** is a project management application (similar to Asana) built with React + TypeScript + Vite, backed by Supabase.

### Key directories

- `src/app/components/` — 40+ feature components (Layout, ProjectPage, TaskDetailPane, KanbanBoard, CalendarPage, etc.)
- `src/app/components/ui/` — Radix UI-based primitives (shadcn/ui pattern)
- `src/app/lib/` — Core logic layer (see below)
- `src/app/hooks/` — Custom React hooks
- `src/imports/` — Auto-generated components from Figma Make (treat as read-only unless updating from Figma)
- `src/styles/` — Global CSS: `theme.css` (OKLCH design tokens), `tailwind.css`, `fonts.css`
- `supabase/functions/server/` — Supabase Edge Functions (Deno)
- `utils/supabase/info.tsx` — Supabase project ID and public anon key

### Core lib files

| File | Purpose |
|------|---------|
| `lib/types.ts` | All TypeScript interfaces (~742 lines) — read this first when working with data models |
| `lib/data.tsx` | Main DataProvider context (~1615 lines) — holds all app state, optimistic updates, batch loading |
| `lib/api.ts` | API client with retry logic — all server communication goes through here |
| `lib/auth.tsx` | Auth context wrapping Supabase auth |
| `lib/navigation.tsx` | Custom routing context (hash-based routing via React Router) |
| `lib/offline.ts` | Offline mutation queue — synced when connectivity restored |
| `lib/integrations.ts` | Asana and Figma integrations |

### Data flow

1. On auth, `DataProvider` batch-loads all workspace data from the API
2. State lives in `DataProvider` context; components consume it via hooks
3. Mutations are applied **optimistically** (UI updates immediately), then sent to Supabase
4. Offline mutations are enqueued in `lib/offline.ts` and replayed on reconnect
5. Real-time updates arrive via Supabase realtime subscriptions

### Routing

Uses React Router v7 with **hash-based routing** (no server-side routing needed). Navigation state is managed via `NavigationContext` in `lib/navigation.tsx` rather than URL params in many cases.

### Styling

- **Tailwind CSS v4** via the Vite plugin (`@tailwindcss/vite`)
- Design tokens defined as CSS custom properties in `src/styles/theme.css` using **OKLCH color scales** (5 hues: red, mustard, teal, azure, purple — each with 9 steps)
- Semantic tokens map to light/dark variants via `[data-theme="dark"]`
- Component variants use `class-variance-authority` (CVA)
- Use `cn()` from `lib/utils` for conditional class merging (`clsx` + `tailwind-merge`)

### Backend (Supabase Edge Functions)

Edge functions live in `supabase/functions/server/` and run on Deno. The main entry is `index.tsx` which routes to sub-handlers: `asana_routes.tsx`, `chat.tsx`, `invites.tsx`, `kv_store.tsx`, `updates.tsx`.

### PWA

`public/sw.js` is the service worker. `public/manifest.json` defines PWA metadata. Push notifications are handled in `lib/push.ts`.
