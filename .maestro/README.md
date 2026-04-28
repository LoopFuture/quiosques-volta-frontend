# Maestro

This repo includes Maestro end-to-end tests for both mobile platforms.

## Layout

- `.maestro/android/`: Android flows (executed by EAS workflow)
- `.maestro/ios/`: iOS flows (executed by EAS workflow)
- `.maestro/shared/`: shared subflows invoked from platform flows via `runFlow`

## Current workflow contract

- `.eas/workflows/maestro-e2e.yml` is manual-only on purpose.
- The workflow already builds platform-specific `e2e-test` artifacts and points Maestro at the platform directories above.

## Running in EAS

- Run the workflow at [`.eas/workflows/maestro-e2e.yml`](../.eas/workflows/maestro-e2e.yml).
- It uses the `e2e-test` EAS build profile (see [`eas.json`](../eas.json)).
- The workflow runs Maestro against:
  - `.maestro/android`
  - `.maestro/ios`

## Running locally

Prereqs:

- Install Maestro locally (see Maestro docs).
- You need an installed app build on a simulator/emulator.
  - For iOS simulator / Android APK builds, the repo already has an `e2e-test` EAS build profile.

Typical local flow:

- Build and install the app:
  - iOS (simulator): `pnpm exec eas build --platform ios --profile e2e-test --local`
  - Android (apk): `pnpm exec eas build --platform android --profile e2e-test --local`
- Start an emulator/simulator and install the artifact.
- Run Maestro:
  - iOS: `maestro test .maestro/ios`
  - Android: `maestro test .maestro/android`

## Required environment & test data

### Keycloak automation

Auth in this app uses `expo-auth-session` (system browser / custom tabs). The Maestro login helper is in:

- `.maestro/shared/keycloak_login_steps.yaml`

It expects these environment variables at runtime:

- `KEYCLOAK_TEST_USERNAME`
- `KEYCLOAK_TEST_PASSWORD`
- `KEYCLOAK_TEST_EMPTY_WALLET_USERNAME`
- `KEYCLOAK_TEST_EMPTY_WALLET_PASSWORD`
- `KEYCLOAK_TEST_NO_PAYOUT_USERNAME`
- `KEYCLOAK_TEST_NO_PAYOUT_PASSWORD`

If your Keycloak login theme uses different labels/ids than the defaults in that file, update selectors in `keycloak_login_steps.yaml` (this is the only place we rely on browser-page selectors).

### Two test users (recommended)

Some flows depend on server-side profile onboarding state.

- **Ready user** (profile setup already completed)
  - Used by: login smoke + tab flows (`01_login_keycloak.yaml`, `10_*` through `22_*`, `30_unlock_entrypoint.yaml`, `31_unlock_pin_failure.yaml`)
- **Setup-required user** (backend returns `onboarding.status != 'completed'`)
  - Used by: `02_profile_setup.yaml` and the PIN unlock flow (`20_unlock_pin.yaml`)
  - This flow enables a PIN of **`1234`** as part of the setup wizard.
- **Empty-wallet ready user**
  - Used by: `23_wallet_empty_state.yaml`
  - Expected state: onboarding completed, payout account present, zero balance, zero wallet history.
- **No-payout ready user**
  - Used by: `24_wallet_transfer_without_payout.yaml`
  - Expected state: onboarding completed, transfer-eligible wallet balance available, payout account absent.

If you want to run both categories locally, the simplest approach is to export different env vars before running each flow set, or run flows individually.

### Backend seed expectations

To make the “major flows” pass consistently, the backend environment should provide:

- Wallet balance sufficient to perform a small transfer (the test submits `1,00`).
- A payout account present for the ready user (or transfers will fail).
- At least one wallet movement for the ready user. The home recent-activity and wallet movements flows now require a first item and open its detail screen.
- The empty-wallet user should have no recent wallet history and no transferable balance.
- The no-payout user should have balance available for transfer but no configured payout account.
