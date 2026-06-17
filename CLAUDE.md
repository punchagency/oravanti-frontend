# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
cp .env.example .env   # first-time setup
npm install
npm run dev            # Vite dev server (localhost:5173)
npm run build          # tsc -b && vite build
npm run lint           # ESLint
```

There is no test runner configured.

## Environment

`VITE_API_URL` must be set (defaults to `http://localhost:3000` in `http-client.ts` but is **required** in `src/api/index.ts`). Copy `.env.example` to `.env` before starting.

## Architecture

React 19 + TypeScript SPA built with Vite. The `@` alias resolves to `src/`.

### Key libraries
- **Chakra UI v3** — not v2; the component API and theming system differ significantly
- **React Router v7** — import from `react-router`, not `react-router-dom`
- **TanStack Query v5** — server/async state
- **Zustand** — client state (auth session, feedback dialog)
- **nuqs** — URL query parameter state (adapter: `nuqs/adapters/react-router/v7`)
- **Zod v4 + react-hook-form + @hookform/resolvers** — form validation
- **Sonner** — toast notifications

### API layer (`src/api/`)

`src/api/index.ts` exports the primary `API` axios instance. It has a full response interceptor that:
1. Catches 401s and attempts a session refresh at `/auth/refresh-session`
2. Queues concurrent failed requests during the refresh
3. Syncs across browser tabs using `BroadcastChannel("auth_session_sync")`
4. Redirects to `/login` on unrecoverable session expiry

All requests use `withCredentials: true` (cookie-based auth — no tokens in localStorage).

`src/services/http-client.ts` exports a plain `httpClient` without interceptors — only use it for unauthenticated endpoints.

### State management (`src/store/`)

- `useAuthStore` — session user, auth loading state, and a `refetch` callback
- `useFeedbackStore` — drives a global feedback dialog; use the `useFeedbackDialog()` hook (`src/hooks/useFeedbackDialog.ts`) to call `showSuccess()` / `showError()` from anywhere

For toasts, use Sonner's `toast` directly.

### Admin layout and navigation

The admin shell is a three-panel layout defined in `src/components/layout/admin-layout.tsx`:
- **PrimaryNavigation** — icon rail on the far left (one item per section)
- **ContextNavigation** — contextual sidebar that changes based on the active section
- **`<Outlet />`** — main content area

Navigation structure (sections, paths, icons) lives entirely in `src/utils/navigation.ts`. `getSectionForPath()` determines the active primary section from the current URL.

### Intake pipeline

All six intake pipeline stages (`lead-inbox`, `conflict-check`, `questionnaire`, `consultation`, `fee-agreement`, `case-opening`) map to the same `IntakePipelinePage` component via separate routes. The component reads `location.pathname` to determine which view to render. Adding a new stage requires: a new route in `App.tsx`, an entry in `viewTitles` and `renderIntakeView` in `src/pages/admin/intake/index.tsx`, and a matching entry in the `contextNavigation.intake` config in `src/utils/navigation.ts`.

### Theming

The Chakra UI theme is defined in `src/utils/theme.ts` via `createSystem`. Use semantic tokens — avoid hardcoded colors:
- `bg`, `bg.subtle`, `bg.muted`, `bg.panel` — background variants
- `fg`, `fg.muted`, `fg.subtle` — foreground/text
- `border`, `border.muted` — borders
- `brand.solid`, `brand.fg` — primary brand color (gold)

Accent colors by role: `accent.admin` (#534AB7), `accent.attorney` (#1D9E75), `accent.staff` (#BA7517), `accent.contractor` (#D85A30).

Named text styles: `heading`, `subheadline`, `label`, `body-sm`. Named layer styles: `surface-card`, `surface-raised`, `brand-button`.

### API error typing

Use the shared `APIError` type from `src/hooks/types.ts` when catching errors from mutation hooks:
```ts
import type { APIError } from "@/hooks/types";
(error as APIError).response?.data?.message
```
