# AGENTS.md

## Scope

These instructions apply to the entire repository.

## Mission

Make the smallest correct change that fits this mobile-only Expo app, use the existing repo commands and hooks, and leave a clear handoff.

## Repo Facts

- Package manager: `pnpm` only.
- App stack: Expo SDK 55, React Native 0.83, React 19, Expo Router, Tamagui, TypeScript.
- Platforms: iOS and Android only. Do not add web-specific routes, config, or build paths unless explicitly asked.
- Import alias: `@/` resolves to `src/`.
- Shared providers live in `src/components/Provider.tsx`.
- Route files live in `src/app`.
- Tests live in `tests`.

## Operating Rules

1. Inspect the relevant files before editing.
2. Keep diffs tight and avoid drive-by refactors.
3. Preserve the current stack choices unless the task requires a change.
4. Do not edit generated or cache-like paths such as `.expo`, `.tamagui`, `dist`, or `tsconfig.tsbuildinfo` unless the task explicitly targets them.
5. When testing UI that depends on Tamagui theme values, wrap the subject with `TamaguiProvider` or the app `Provider`.
6. Prefer extending the existing provider, routing, and Tamagui patterns instead of introducing parallel abstractions.

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

## Useful Commands

- `pnpm start`
- `pnpm ios`
- `pnpm android`
- `pnpm lint`
- `pnpm typecheck`
- `pnpm test:ci`
- `pnpm test:coverage`
- `pnpm build`
