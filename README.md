# Volta Frontend

Mobile-first Expo app using Expo Router, React Native, and Tamagui. The repo is managed with `pnpm` and is currently set up for iOS and Android only.

## Getting Started

- Use Node `22` as defined in `.nvmrc` and `package.json`.
- Use the pinned `pnpm` version from `packageManager`.
- Install dependencies with `pnpm install`.
- Copy `.env.example` into your local env file and provide the required auth values before starting Expo.
- Start local development with `pnpm start`, `pnpm ios`, or `pnpm android`.

## Stack

- Expo SDK 55
- React Native 0.83
- React 19.2
- Expo Router for file-based navigation
- Tamagui for UI primitives, themes, and compiler-based extraction
- React Query for server-state and API-ready data flows
- EAS Update with fingerprint-based runtime compatibility
- EAS Insights for cold-start metrics in built apps
- Sentry for runtime diagnostics, breadcrumbs, and error capture
- TypeScript
- Jest + React Native Testing Library
- ESLint + Prettier
- Husky

## Commands

| Command                    | What it does                                                                           | When to use it                                      |
| -------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `pnpm install`             | Installs dependencies and enables Husky hooks via `prepare`.                           | First clone, dependency updates, clean install.     |
| `pnpm start`               | Starts the Expo dev server and clears the cache.                                       | General local development.                          |
| `pnpm ios`                 | Starts Expo and opens the iOS target.                                                  | iOS simulator/device development.                   |
| `pnpm android`             | Starts Expo and opens the Android target.                                              | Android emulator/device development.                |
| `pnpm build`               | Runs both mobile export builds through the Tamagui compiler wrapper.                   | Production bundle verification for both platforms.  |
| `pnpm build:local`         | Runs the local EAS iOS simulator and Android APK builds back to back.                  | Verifying both local native build profiles.         |
| `pnpm build:local:ios`     | Runs a local EAS iOS simulator build and writes the archive to `dist/ios/builds`.      | Checking the local iOS simulator build output.      |
| `pnpm build:local:android` | Runs a local EAS Android development APK build and writes it to `dist/android/builds`. | Checking the local Android APK build output.        |
| `pnpm build:ios`           | Runs `tamagui build --target native` and exports an iOS bundle to `dist/ios`.          | Production iOS bundle check.                        |
| `pnpm build:android`       | Runs `tamagui build --target native` and exports an Android bundle to `dist/android`.  | Production Android bundle check.                    |
| `pnpm lint`                | Runs ESLint across the repo.                                                           | Repo-wide lint validation before PRs or CI fixes.   |
| `pnpm lint:file -- <path>` | Runs ESLint against a single file or file set.                                         | Fast validation while iterating on a small change.  |
| `pnpm lint:fix`            | Runs ESLint with autofixes.                                                            | Cleaning up lint issues locally.                    |
| `pnpm format`              | Formats the repo with Prettier.                                                        | Bulk formatting before review.                      |
| `pnpm format:check`        | Verifies Prettier formatting without changing files.                                   | CI and manual repo-wide format checks.              |
| `pnpm typecheck`           | Runs `tsc --noEmit`.                                                                   | Catching TypeScript regressions.                    |
| `pnpm test`                | Runs the Jest suite once.                                                              | General test runs.                                  |
| `pnpm test:file -- <path>` | Runs Jest in CI mode for a single file or pattern.                                     | Targeted test runs for the file you changed.        |
| `pnpm test:coverage`       | Runs the Jest suite with coverage collection and threshold enforcement.                | Coverage checks and regression prevention.          |
| `pnpm test:watch`          | Runs Jest in watch mode.                                                               | Active test-driven work.                            |
| `pnpm test:ci`             | Runs Jest in non-watch CI mode with coverage thresholds enforced.                      | CI-only coverage validation.                        |
| `pnpm validate`            | Runs `format:check`, `lint`, and `typecheck` in sequence.                              | Canonical local validation and the pre-commit gate. |
| `pnpm validate:ci`         | Runs `validate` and then `test:ci`.                                                    | CI validation with coverage enforcement.            |
| `pnpm validate:full`       | Runs `validate` and then `build`.                                                      | Changes that may affect bundling or runtime setup.  |

## Runtime Config

- Copy `.env.example` to your local env file.
- Required auth envs:
  - `KEYCLOAK_ISSUER_URL`
  - `KEYCLOAK_CLIENT_ID`
- Optional auth envs:
  - `KEYCLOAK_SCOPES`
- Optional diagnostics envs:
  - `SENTRY_DSN`
  - `SENTRY_ENVIRONMENT`
  - `SENTRY_RELEASE`
  - `SENTRY_TRACES_SAMPLE_RATE`
- Optional Sentry build/upload envs:
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
  - `SENTRY_URL`
  - `SENTRY_DISABLE_AUTO_UPLOAD`
  - `SENTRY_ALLOW_FAILURE`
- Required app API envs:
  - `API_BASE_URL`
- Required web app envs:
  - `WEB_APP_BASE_URL`
- Optional Android push envs:
  - `ANDROID_GOOGLE_SERVICES_FILE`
- These values are injected at build time through `app.config.ts` and read at runtime from `expo-constants`.
- App data requests go through the shared fetch client in `src/features/app-data/api`.
- `API_BASE_URL` is required and is injected from env into `extra.api.baseUrl`.
- `WEB_APP_BASE_URL` is required and is injected from env into `extra.webApp.baseUrl`.
- The OpenAPI reference lives in `docs/volta-backend-api.openapi.yaml`.
- EAS Update is configured through `app.config.ts` with a fixed `updates.url` and `runtimeVersion.policy = 'fingerprint'`.
- `SENTRY_ENVIRONMENT` defaults to the active `EAS_BUILD_PROFILE` when available, otherwise `NODE_ENV`.
- Sentry tracing defaults to `1.0` in development and `0.0` elsewhere. Set `SENTRY_TRACES_SAMPLE_RATE` explicitly to enable tracing outside development.
- Expo export sourcemaps are uploaded automatically during `pnpm build` only when `SENTRY_AUTH_TOKEN` is present. The upload helper resolves org/project from `SENTRY_ORG` and `SENTRY_PROJECT` or the Sentry Expo plugin config.
- Native Sentry upload steps added by the Expo plugin also require `SENTRY_AUTH_TOKEN` in the EAS build environment unless you explicitly disable them.
- The `development` EAS profile sets `SENTRY_DISABLE_AUTO_UPLOAD=true` so local dev-client builds do not fail on native Sentry uploads.
- EAS Insights is enabled by installing `expo-insights`; no extra app code is required.
- The mobile app uses a Keycloak public OIDC client with PKCE. Do not configure or ship a client secret in the app.
- `KEYCLOAK_SCOPES` defaults to `openid` when omitted.
- Register `voltafrontend://auth/callback` as an allowed redirect URI in Keycloak for the mobile client.
- OAuth/OIDC testing must run in an iOS or Android development build. Expo Go is not supported for this auth flow.

## EAS Delivery

- The repo now includes EAS workflow files under `.eas/workflows`.
- You can run them manually today with `pnpm exec eas workflow:run .eas/workflows/<file>.yml`.
- After the repo moves to GitHub, the trigger blocks in those files will start handling automatic push and pull request events.
- `.eas/workflows/validate.yml` mirrors CI-style repo validation plus coverage enforcement for `dev`, `staging`, and `main`.
- `.eas/workflows/deliver-preview.yml` targets `staging` and the `preview` EAS channel.
- `.eas/workflows/release-production.yml` is manual-only and targets the `production` EAS channel plus `submit.production`.

## OTA Updates

- OTA compatibility is gated by Expo fingerprint runtime versions.
- JavaScript, copy, style, and asset-only changes usually reuse an existing compatible build and go out as EAS Update publishes.
- Native or runtime-affecting changes generate a different fingerprint and require a new build instead of an OTA update.
- The preview and production workflows first look for an existing build with the current fingerprint and channel before deciding whether to publish an update or build a new binary.
- After enabling EAS Update, create and install fresh preview and production binaries once. Older binaries built before this setup will not receive OTA updates.
- Keep EAS environment variables aligned across `preview` and `production` so fingerprint and update jobs resolve the same runtime inputs as the matching builds.

## EAS Environments

- Build profiles are pinned to EAS channels and environments:
  - `development` -> `development`
  - `preview` -> `preview`
  - `production` -> `production`
- Use EAS environment variables for secrets and per-environment runtime values that must stay consistent across fingerprint, build, update, and submit jobs.
- For production submissions, make sure the Expo project has valid Apple and Google Play credentials configured before running `.eas/workflows/release-production.yml`.

## Authentication Flow

- `src/app/auth` is the only public route. The root layout waits for auth hydration before rendering protected routes, so anonymous users stay on the auth screen.
- `src/features/auth` owns the Keycloak screen, runtime config parsing, secure token storage, and session refresh logic.
- Login and register both use Keycloak OIDC Authorization Code Flow with PKCE through `expo-auth-session`.
- Register adds `prompt=create`, and both auth actions pass the app preference mode as the Keycloak theme query value: `system`, `light`, or `dark`.
- Tokens are persisted in `expo-secure-store`. MMKV remains limited to non-sensitive client storage such as theme, language, onboarding, and device privacy toggles. The shared MMKV store uses a neutral client-storage namespace rather than preference-specific naming. Profile setup completion comes from the authenticated profile/bootstrap API.

## Push Notifications

- Push notification readiness uses `expo-notifications` and `expo-device`, with runtime registration tied to `extra.eas.projectId` from `app.config.ts`.
- Native permission prompts are user-driven: the profile setup security step and the profile privacy push toggle request permission when the user explicitly enables push notifications.
- App launch does not prompt for notification permission. It only restores the current permission/token state and notification tap handling.
- Full push verification requires a physical iOS or Android device. Simulators and emulators do not support Expo push token registration.
- Android builds that should register an Expo push token also need `ANDROID_GOOGLE_SERVICES_FILE` pointing to a valid `google-services.json` before the build starts.
- After adding or changing `ANDROID_GOOGLE_SERVICES_FILE`, rebuild the Android app. Expo Go and already-installed binaries will not pick up the new Firebase config.
- For end-to-end delivery outside tests, configure APNs and FCM credentials for the EAS project before building a development build or production binary.

## Monitoring

- Shared diagnostics live under `src/features/app-data/monitoring`.
- React Query queries and mutations emit structured diagnostics through the shared query client, with console logging enabled only in development builds.
- Auth session lifecycle, sign-in flow, push permission/token lifecycle, notification routing, and uncaught route errors also flow through the same diagnostics layer.
- Sentry is optional at runtime. When `SENTRY_DSN` is unset, the app keeps local diagnostics behavior and skips remote event delivery.
- The current setup covers breadcrumbs, error capture, API diagnostics, opt-in navigation tracing, EAS Insights cold-start metrics, and sourcemap/debug-file upload when build credentials are configured. It does not add replay.

## End-to-End Testing

- Maestro scaffolding lives under `.maestro/android` and `.maestro/ios`.
- `.eas/workflows/maestro-e2e.yml` is manual-only until real Maestro flows are added.
- The workflow already builds platform-specific `e2e-test` artifacts and points Maestro at those directories, so enabling it later should only require adding flow files and adjusting triggers.
- Start with one smoke test per platform before widening coverage or enabling pull request automation.

## Project Layout

- `src/app`: Expo Router entrypoints and layouts.
- `src/features`: Feature-owned screens, navigation helpers, feature-specific components, and feature-local presentation helpers.
- `src/features/app-shell`: Shared shell navigation, tab chrome, not-found handling, and cross-feature app-shell helpers.
- `src/features/auth`: Keycloak auth screen, session provider, runtime config, and SecureStore-backed token helpers.
- `src/features/<feature>/models`: Feature-owned schemas, inferred types, and API-ready view-model helpers.
- `src/features/<feature>/forms`: Feature-owned RHF/Zod form schemas, default-value builders, normalization helpers, and request serializers.
- `src/features/<feature>/api.ts`: Feature-owned request helpers that talk to the shared app API client.
- `src/features/<feature>/hooks`: Feature-owned React Query hooks and screen-facing async data access.
- `src/features/app-data/api`: Shared app API runtime config, request client, and API error types.
- `src/features/app-data/monitoring`: Shared diagnostics runtime config, Sentry bootstrap, redaction, and structured logging helpers.
- `src/features/app-data/query`: Shared query client setup, keys, and invalidation helpers.
- `src/hooks`: Shared app-wide hooks.
- `src/features/app-data/storage`: Shared MMKV-backed client storage. App preferences live under `preferences/`, and broader device/client persistence such as onboarding and privacy toggles live under `device/`.
- `src/i18n`: i18next setup, locale resources, and shared formatting helpers.
- `src/components`: App-wide providers and shared UI support components.
- `src/components/ui`: Shared UI primitives aligned with the Tamagui theme and token system.
- `src/assets`: App images.
- `src/tamagui.config.ts`: Tamagui theme/token configuration.
- `tamagui.build.ts`: Shared Tamagui compiler/build configuration.
- `app.config.ts`: Expo app config for native metadata, icons, splash assets, and localization plugin setup.
- `tests/features`: Feature-owned tests grouped by feature.
- `tests/router`: Expo Router route and layout tests.
- `tests/ui`: Shared primitive component tests.
- `tests/providers`: Provider-specific tests.
- `tests/support`: Shared Jest setup, helpers, and reusable mocks.
- `tests/i18n`: Localization and translation behavior tests.
- `.husky`: Git hooks for local validation.
- `.eas/workflows`: EAS cloud workflows for validation, OTA/build delivery, and dormant Maestro execution.
- `.maestro`: Platform-specific Maestro flow directories and setup notes.

## Development Notes

- Internal source imports use the `@/` alias, which resolves to `src/`.
- `src/app` should stay thin; prefer re-exporting or composing feature screens from `src/features`.
- `src/features/app-shell` owns shared tab/navigation UI. Keep cross-feature shell behavior there instead of pushing it into route files.
- Wire translations directly in the owning screen, navigation helper, or feature component with `useTranslation`.
- Put raw API contracts, Zod schemas, serializers, and view-model shaping in the owning feature's `models/` or `forms/` folder. Keep translation and formatting decisions in UI or screen-local presentation helpers.
- For future API work, prefer updating the feature-owned serializer/model helpers before changing screen components directly.
- Put feature request helpers in `src/features/<feature>/api.ts`. Keep React Query hooks in `src/features/<feature>/hooks`.
- Place feature-specific hooks under `src/features/<feature>/hooks` and shared hooks under `src/hooks`.
- React Query is the default layer for server-like reads and writes. Screens should consume feature hooks rather than calling model builders directly.
- Shared diagnostics and Sentry logging are centralized. Prefer emitting app-wide runtime logs through `src/features/app-data/monitoring` instead of ad hoc `console.*` calls in features.
- MMKV-backed client storage lives under `src/features/app-data/storage`. Keep true app preferences under `preferences/` and broader device/client state under `device/`. Authenticated profile/setup status should come from the API layer.
- Prefer composing Tamagui UI components before creating new shared primitives, and keep shared UI styling inside the existing theme and token system.
- Auth state is separate from MMKV client storage: Keycloak tokens live in `expo-secure-store`, and auth runtime values come from `app.config.ts` via Expo Constants.
- Sentry runtime values also come from `app.config.ts` via Expo Constants, and remain optional.
- Locale-sensitive copy should be assembled in screens and UI components with `useTranslation`. Keep raw API state and enums separate from localized labels, and avoid memoizing translated output across locale changes.
- Use skeletons for first-load async states and add pull-to-refresh only on read-heavy screens.
- This repo is mobile-only. Web-specific routes and build paths were intentionally removed.
- `tests/providers` owns provider and cross-cutting runtime tests. `tests/i18n` owns localization behavior and translation regressions.
- If multiple suites need the same module mock, move it into `tests/support` instead of repeating inline `jest.mock(...)` blocks across files.
- Prefer tests that exercise route entrypoints or production-mounted feature screens. If a component is only used by tests, either integrate it into the app immediately or remove it.
- Local and CI runtime expectations are pinned to Node 22 through `.nvmrc`, `package.json`, and the CI image.
- For Expo-managed native packages, prefer `pnpm exec expo install <package>` and use `pnpm exec expo install --check` before manual version bumps.
- Tamagui is intentionally pinned to a single `2.0.0-rc.22` set across runtime, compiler, and plugin packages. Avoid piecemeal version bumps; update that line in one pass after Expo/React Native compatibility is confirmed.
- The Tamagui compiler is enabled through both Babel and Metro. The build scripts additionally wrap Expo export with `tamagui build --target native`.
- `AGENTS.md` defines the repo contract for autonomous coding agents.
- `.impeccable.md` is the source of truth for repo-specific UI, UX, and visual design context.
- `pnpm install` enables Husky hooks automatically.
- Pre-commit runs `pnpm validate`.
- There is no pre-push hook.
- CI should run `pnpm validate:ci` and `pnpm build`. It does not run EAS commands.
- EAS Workflows are committed for manual use now and for GitHub-triggered automation later.

## Recommended Validation Flow

For most changes:

1. `pnpm validate`

For UI, provider, theme, routing, or bundling-sensitive changes:

1. `pnpm validate:full`

For fast local iteration on a small diff:

1. `pnpm lint:file -- <path>`
2. `pnpm test:file -- <path>`

## Documentation

Current stack:

- Expo docs: https://docs.expo.dev/
- Tamagui docs: https://tamagui.dev/docs/intro/introduction
- Expo unit testing guide: https://docs.expo.dev/develop/unit-testing/
- React Native MMKV docs: https://github.com/mrousavy/react-native-mmkv

Project docs:

- `docs/volta-backend-api.openapi.yaml`: canonical Volta Backend API OpenAPI contract reference for this repo.
- `docs/volta-backend-api.md`: companion summary of the current backend contract surface and integration notes.
