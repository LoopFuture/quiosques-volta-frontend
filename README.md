# Volta Frontend

Mobile-first Expo app using Expo Router, React Native, and Tamagui. The repo is managed with `pnpm` and is currently set up for iOS and Android only.

## Stack

- Expo SDK 55
- React Native 0.83
- React 19.2
- Expo Router for file-based navigation
- Tamagui for UI primitives, themes, and compiler-based extraction
- TypeScript
- Jest + React Native Testing Library
- ESLint + Prettier
- Husky

## Commands

| Command                    | What it does                                                                           | When to use it                                     |
| -------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------- |
| `pnpm install`             | Installs dependencies and enables Husky hooks via `prepare`.                           | First clone, dependency updates, clean install.    |
| `pnpm start`               | Starts the Expo dev server and clears the cache.                                       | General local development.                         |
| `pnpm ios`                 | Starts Expo and opens the iOS target.                                                  | iOS simulator/device development.                  |
| `pnpm android`             | Starts Expo and opens the Android target.                                              | Android emulator/device development.               |
| `pnpm build`               | Runs both mobile export builds through the Tamagui compiler wrapper.                   | Production bundle verification for both platforms. |
| `pnpm build:local`         | Runs the local EAS iOS simulator and Android APK builds back to back.                  | Verifying both local native build profiles.        |
| `pnpm build:local:ios`     | Runs a local EAS iOS simulator build and writes the archive to `dist/ios/builds`.      | Checking the local iOS simulator build output.     |
| `pnpm build:local:android` | Runs a local EAS Android development APK build and writes it to `dist/android/builds`. | Checking the local Android APK build output.       |
| `pnpm build:ios`           | Runs `tamagui build --target native` and exports an iOS bundle to `dist/ios`.          | Production iOS bundle check.                       |
| `pnpm build:android`       | Runs `tamagui build --target native` and exports an Android bundle to `dist/android`.  | Production Android bundle check.                   |
| `pnpm lint`                | Runs ESLint across the repo.                                                           | Repo-wide lint validation before PRs or CI fixes.  |
| `pnpm lint:fix`            | Runs ESLint with autofixes.                                                            | Cleaning up lint issues locally.                   |
| `pnpm format`              | Formats the repo with Prettier.                                                        | Bulk formatting before review.                     |
| `pnpm format:check`        | Verifies Prettier formatting without changing files.                                   | CI and manual repo-wide format checks.             |
| `pnpm typecheck`           | Runs `tsc --noEmit`.                                                                   | Catching TypeScript regressions.                   |
| `pnpm test`                | Runs the Jest suite once.                                                              | General test runs.                                 |
| `pnpm test:coverage`       | Runs the Jest suite with source-wide coverage collection and threshold enforcement.    | Coverage checks and regression prevention.         |
| `pnpm test:watch`          | Runs Jest in watch mode.                                                               | Active test-driven work.                           |
| `pnpm test:ci`             | Runs Jest in non-watch CI mode.                                                        | CI, Husky pre-push, repeatable local validation.   |

## Project Layout

- `src/app`: Expo Router routes and layouts.
- `src/components`: Shared UI components and providers.
- `src/assets`: App images and fonts.
- `src/tamagui.config.ts`: Tamagui theme/token configuration.
- `tamagui.build.ts`: Shared Tamagui compiler/build configuration.
- `app.config.ts`: Expo app config. Native startup/background colors are derived from Tamagui theme values.
- `tests`: Jest setup and repo-level tests.
- `.husky`: Git hooks for local validation.

## Development Notes

- Internal source imports use the `@/` alias, which resolves to `src/`.
- This repo is mobile-only. Web-specific routes and build paths were intentionally removed.
- The Tamagui compiler is enabled through both Babel and Metro. The build scripts additionally wrap Expo export with `tamagui build --target native`.
- `AGENTS.md` defines the repo contract for autonomous coding agents.
- `pnpm install` enables Husky hooks automatically.
- Pre-commit formats staged files and runs cached ESLint only on staged JS/TS files.
- Pre-push runs `pnpm typecheck` and `pnpm test:ci`.
- GitLab CI runs `pnpm format:check`, `pnpm lint`, `pnpm typecheck`, `pnpm test:ci`, and `pnpm build`. It does not run EAS commands.

## Recommended Validation Flow

For normal application changes:

1. `pnpm lint`
2. `pnpm typecheck`
3. `pnpm test:ci`

For UI or bundling-sensitive changes:

1. `pnpm build:ios`
2. `pnpm build:android`

## Documentation

Current stack:

- Expo docs: https://docs.expo.dev/
- Tamagui docs: https://tamagui.dev/docs/intro/introduction
- Expo unit testing guide: https://docs.expo.dev/develop/unit-testing/
- TanStack Query React Native docs: https://tanstack.com/query/latest/docs/react/react-native
- Zustand docs: https://zustand.docs.pmnd.rs/
- React Hook Form + Zod -
- React Native MMKV – Ultra-fast key-value storage - https://github.com/mrousavy/react-native-mmkv
- FlashList – High-performance list rendering (better than FlatList)
