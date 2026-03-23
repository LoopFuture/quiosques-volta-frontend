# Maestro

This repo includes dormant Maestro scaffolding for both mobile platforms.

## Layout

- `.maestro/android/`: future Android flows
- `.maestro/ios/`: future iOS flows

## Current workflow contract

- `.eas/workflows/maestro-e2e.yml` is manual-only on purpose.
- The workflow already builds platform-specific `e2e-test` artifacts and points Maestro at the platform directories above.
- Add real `.yaml` flow files under each platform directory before enabling branch or pull-request triggers.

## Suggested next step

- Start with one smoke flow per platform that launches the app and verifies the auth screen, then expand to critical happy paths.
