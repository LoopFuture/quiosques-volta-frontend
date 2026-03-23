# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Mission

Make the smallest correct change that fits this mobile-only Expo app, use the existing repo commands and hooks, and leave a clear handoff.

## Repo Facts

- Package manager: `pnpm` only.
- App stack: Expo SDK 55, React Native 0.83, React 19, Expo Router, Tamagui, TypeScript.
- Data stack: React Query for server-state, MMKV for persisted client storage.
- Platforms: iOS and Android only. Do not add web-specific routes, config, or build paths unless explicitly asked.
- Import alias: `@/` resolves to `src/`.
- Route files live in `src/app`. Keep them as Expo Router entrypoints and layouts.
- Feature-owned screens, navigation helpers, feature-specific components, and feature-local presentation helpers live in `src/features/<feature>`.
- Shared app-shell navigation, tab chrome, and cross-feature shell helpers live in `src/features/app-shell`.
- Auth runtime config is injected from env in `app.config.ts` and consumed in-app through `expo-constants`.
- Optional Sentry runtime config is injected from env in `app.config.ts` and consumed in-app through `expo-constants`.
- Optional app API runtime config is injected from env in `app.config.ts` and consumed in-app through `expo-constants`.
- Optional Sentry build-time sourcemap upload config is read from env during Expo export builds.
- Feature-owned schemas, typed mock data builders, and API-ready view-model helpers live in `src/features/<feature>/models`.
- Feature-owned form schemas, RHF helpers, normalization logic, and request serializers live in `src/features/<feature>/forms`.
- Feature-owned app API request helpers live in `src/features/<feature>/api.ts`.
- Feature-owned query and mutation hooks live in `src/features/<feature>/hooks`.
- Shared app API runtime config, request client, and error types live in `src/features/app-data/api`.
- Shared diagnostics, redaction helpers, and Sentry bootstrap live in `src/features/app-data/monitoring`.
- Shared query client, keys, and invalidation helpers live in `src/features/app-data/query`.
- Shared session-only MSW-backed backend emulator helpers live in `src/features/app-data/mock`.
- Shared MMKV-backed client storage lives in `src/features/app-data/storage`.
- Shared i18n bootstrap, locales, and formatting helpers live in `src/i18n`.
- Shared UI primitives live in `src/components/ui`.
- Shared providers live in `src/components/Provider.tsx`.
- Tests live in `tests`.
- Feature-owned tests live in `tests/features`, route and layout tests live in `tests/router`, shared UI tests live in `tests/ui`, and shared test helpers/setup plus reusable mocks live in `tests/support`.
- Provider-specific tests live in `tests/providers`.
- Localization tests live in `tests/i18n`.

## Operating Rules

1. Inspect the relevant files before editing.
2. Keep diffs tight and avoid drive-by refactors.
3. Preserve the current stack choices unless the task requires a change.
4. Do not edit generated or cache-like paths such as `.expo`, `.tamagui`, `dist`, or `tsconfig.tsbuildinfo` unless the task explicitly targets them.
5. When testing UI that depends on Tamagui theme values, wrap the subject with `TamaguiProvider` or the app `Provider`.
6. Prefer extending the existing provider, routing, and Tamagui patterns instead of introducing parallel abstractions.
7. Keep `src/app` thin. Put feature logic, feature copy, and feature-specific components under the owning `src/features/<feature>` slice.
8. Wire translations directly in the owning screen, navigation helper, or feature component with `useTranslation`. Put Zod schemas, mock builders, serializers, and view-model shaping under the owning feature's `models/` or `forms/` folder, and keep translation/formatting decisions in UI or screen-local presentation helpers.
9. When adding API-prep contracts, prefer feature-local types and serializers over cross-feature abstractions unless the helper is truly generic.
10. Use React Query for server-state and API-ready async reads/writes. Screens should consume feature hooks instead of calling mock/model builders directly.
11. Keep MMKV-backed client storage in `src/features/app-data/storage`, with app preferences under `preferences/` and broader device/client state under `device/`. Do not introduce Zustand to mirror React Query cache or client storage state.
12. Keep auth tokens and other credentials out of MMKV. Use `expo-secure-store` via the existing auth storage helpers.
13. Use `src/features/app-data/mock` for the session-only MSW backend emulator and `src/features/app-data/query` for shared query helpers.
14. Prefer the shared diagnostics layer in `src/features/app-data/monitoring` for app-wide runtime logging and Sentry breadcrumbs instead of feature-local logging utilities.
15. Add tests by ownership: feature tests in `tests/features/<feature>`, router tests in `tests/router`, shared primitive tests in `tests/ui`, and shared helpers in `tests/support`.
16. When a mock is reused across suites, move it into `tests/support` instead of duplicating inline `jest.mock(...)` blocks.
17. Prefer tests that exercise route entrypoints or production-mounted feature screens. Do not keep components that are only referenced by tests unless the task explicitly requires a staging abstraction.
18. Prefer Tamagui UI primitives and composites such as `Button`, `Card`, `Switch`, `ToggleGroup`, `Progress`, `Label`, `Input`, and `ListItem` before building custom shared controls from scratch.
19. Create a shared wrapper only when it preserves app-specific API, accessibility, or branded behavior that Tamagui does not provide directly.
20. Keep shared UI aligned with the existing Tamagui theme, tokens, and tone system. Avoid one-off styling patterns outside that model unless the task requires it.
21. For UI, UX, and visual design changes, consult `.impeccable.md` and preserve its design context unless the task explicitly requires a new direction.

## Standard Workflow

1. Read `package.json`, `README.md`, and the target files.
2. Decide the smallest viable implementation.
3. Make the change.
4. Run the smallest relevant built-in validation command when local verification is useful.
5. Rely on the existing Git hooks and CI as the canonical enforcement path.
6. Report:
   - files changed
   - commands run
   - result
   - remaining risk or follow-up

## Validation Matrix

Use the smallest built-in command that matches the scope of the change.

- Single-file lint checks while iterating: `pnpm lint:file -- <path>`
- Single test file checks while iterating: `pnpm test:file -- <path>`
- Typical screen, route, copy, or shared component changes: `pnpm validate`
- Provider, auth, theme, root layout, Expo config, or bundling-sensitive changes: `pnpm validate:full`
- Package, TypeScript, ESLint, Jest, Metro, or other repo tooling changes: `pnpm validate`
- If impact is unclear or crosses multiple areas, default to `pnpm validate`

## Useful Commands

- `pnpm start`
- `pnpm ios`
- `pnpm android`
- `pnpm lint:file -- <path>`
- `pnpm lint`
- `pnpm test:file -- <path>`
- `pnpm typecheck`
- `pnpm test:ci`
- `pnpm test:coverage`
- `pnpm validate`
- `pnpm validate:full`
- `pnpm build`
