<!-- BEGIN:nextjs-agent-rules -->
# Next.js: ALWAYS read docs before coding

This project uses Next.js 16.2.9 with App Router. Before any Next.js work, read the relevant version-matched guide in `node_modules/next/dist/docs/`. Do not rely on older Next.js knowledge for routing, data fetching, caching, server/client component behavior, file conventions, or config options. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project Instructions

## Project Overview

Life Management Platform is a personal finance and life-management web app. Current implemented areas include authentication and finance management for accounts, income, expenses, transfers, recurring transactions, savings goals, debts, categories, settings, and summary views.

## Tech Stack

- Framework: Next.js 16.2.9 App Router
- React: 19.2.4
- Language: TypeScript with `strict: true`
- Styling: Tailwind CSS v4 through `@tailwindcss/postcss`
- Backend services: Firebase Authentication and Firestore
- Icons: `lucide-react`
- Utilities: `clsx`, `tailwind-merge`, `date-fns`

## Commands

- Install dependencies: `npm install`
- Start development server: `npm run dev`
- Production build: `npm run build`
- Start production server after build: `npm run start`
- Lint: `npm run lint`

Run `npm run lint` after code changes when practical. Run `npm run build` for changes that affect routing, Next.js config, server/client boundaries, environment handling, or shared data shapes.

## Project Structure

- `src/app/`: App Router routes, layouts, route-level pages, global CSS, metadata, and favicon.
- `src/components/ui/`: Shared low-level UI primitives such as `Button`, `Card`, and `Input`.
- `src/components/layout/`: App shell and layout wrappers, including auth-aware layout handling.
- `src/features/auth/`: Auth context, guards, services, hooks, types, and auth-specific components.
- `src/features/finance/`: Finance domain code grouped by components, hooks, services, types, and utilities.
- `src/lib/`: Cross-cutting utilities and service setup such as `cn()` and Firebase initialization.
- `public/`: Static public assets.

Prefer adding new domain code under `src/features/<feature>/` and keeping `src/app/` focused on route composition.

## Next.js Rules

- Use App Router conventions under `src/app`.
- Pages and layouts are Server Components by default. Add `"use client"` only to files that need React state, effects, event handlers, browser APIs, Firebase client SDK interaction, custom client hooks, or context.
- Keep Client Component boundaries narrow. Avoid marking route pages or broad layouts as client components unless the existing pattern requires it.
- When adding or changing route files, check the matching docs in `node_modules/next/dist/docs/01-app/`.
- For component boundary questions, read `node_modules/next/dist/docs/01-app/01-getting-started/05-server-and-client-components.md`.
- For file and folder conventions, read `node_modules/next/dist/docs/01-app/01-getting-started/02-project-structure.md`.
- Do not introduce Pages Router patterns unless explicitly requested.

## TypeScript And Imports

- Preserve strict TypeScript. Avoid `any`; define or extend types in the relevant feature `types` folder.
- Use the `@/*` path alias for imports from `src`.
- Prefer existing utilities and domain services before creating new helpers.
- Keep data shapes consistent with `src/features/finance/types` and `src/features/auth/types`.

## Firebase And Data

- Firebase config lives in `src/lib/firebase.ts`.
- Finance data is organized under Firestore user subcollections, for example `users/{userId}/accounts`.
- Do not hard-code secrets or credentials. Client-exposed Firebase env vars must use the `NEXT_PUBLIC_` prefix.
- Keep Firestore access in feature services under `src/features/*/services` where possible.
- Always handle missing `userId` defensively, following the existing service pattern.
- Be careful with changes that alter collection paths, document IDs, or persisted field names; they can affect existing user data.

## UI And Styling

- Use existing UI primitives from `src/components/ui` before adding new primitives.
- Use `cn()` from `src/lib/utils.ts` for conditional class merging.
- Keep the current restrained finance-app style: clean layout, gray/white base, rounded cards/buttons, focused data presentation.
- Use `lucide-react` for icons when adding icon buttons or navigation items.
- Keep Thai language support intact. The root layout uses `html lang="th"` and `Noto Sans Thai` as the primary sans-serif font, with fallbacks after it.
- Make interfaces responsive and avoid text overflow in buttons, cards, tables, and navigation.

## Code Change Guidance

- Read nearby files before editing and match existing patterns.
- Keep edits scoped to the requested behavior.
- Do not edit generated files such as `.next/` or `next-env.d.ts`.
- Do not commit `.env.local` or include real secrets in docs, tests, or examples.
- Do not add new dependencies, UI libraries, state libraries, or database abstractions without a clear need.
- If modifying shared services, hooks, or types, check all call sites in the feature.

## Verification Checklist

Before finishing substantial code changes:

- Run `npm run lint` if the change touches TypeScript, React, or config.
- Run `npm run build` when changing routes, Next.js behavior, auth wrappers, or shared data contracts.
- Manually inspect affected UI in the browser for layout, responsive behavior, and Thai text rendering when UI changed.
