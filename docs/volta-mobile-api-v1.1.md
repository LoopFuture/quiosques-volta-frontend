# Volta Mobile API v1.1

## Why this change is necessary

For user-specific push notifications with Expo, the backend should not store a single push token on the user profile.

A push token is **installation-scoped**, not truly user-scoped:

- one user can have multiple devices
- the same user can reinstall the app and get a new token
- a token may rotate without any profile change
- logout and account switching need token cleanup per installation

Because of that, the correct contract is a **push installation registration** model.

## New endpoints

### Push registrations

- `PUT /push/installations/{installationId}`
- `DELETE /push/installations/{installationId}`

### Notifications

- `GET /notifications`
- `POST /notifications/read`
- `DELETE /notifications`

## What the new push endpoint does

### `PUT /push/installations/{installationId}`

Purpose:

- register the current authenticated app installation for push delivery
- update the stored Expo push token if it changes
- keep metadata such as platform and app version for diagnostics

Why `PUT`:

- this should be idempotent
- the client can safely retry
- the same installation should be updated in place instead of creating duplicate rows

Request body:

- `provider`: currently `expo`
- `token`: Expo push token
- `platform`: `ios` or `android`
- `appVersion`: optional
- `buildNumber`: optional
- `deviceModel`: optional

### `DELETE /push/installations/{installationId}`

Purpose:

- unregister a device on logout
- unregister a device when notification permission is revoked
- unregister a device when switching accounts on the same device

Why installation delete matters:

- deleting all notifications is not the same as removing delivery capability
- token lifecycle must be handled independently from inbox lifecycle

## Recommended Expo client flow

### 1. Create a stable installation ID once

The app should generate a UUID once per installation and persist it locally, for example in secure local storage.

This value should survive app restarts.
If the app is reinstalled, a new installation ID is acceptable.

### 2. After login, request notification permission

If the user grants permission, obtain the Expo push token in the app.

### 3. Register the installation

Call:

`PUT /push/installations/{installationId}`

with the token and device metadata.

### 4. Re-register when the token changes

If the Expo push token changes, call the same `PUT` again with the same installation ID and the new token.

### 5. Unregister on logout or permission revocation

Call:

`DELETE /push/installations/{installationId}`

This prevents notifications from continuing to go to a device that should no longer receive them for that account.

## Why this is better than storing a token on `/profile`

Do **not** put push tokens inside `PATCH /profile`.

Reasons:

- profile is user-scoped, token is installation-scoped
- it breaks multi-device support
- it makes account switching hard to reason about
- it couples delivery plumbing to profile edits
- it encourages a single-token-per-user anti-pattern

## Recommended backend data model

Recommended table: `push_installations`

Suggested fields:

- `id`
- `user_id`
- `installation_id` (unique)
- `provider`
- `push_token`
- `platform`
- `app_version`
- `build_number`
- `device_model`
- `registered_at`
- `last_seen_at`
- `unregistered_at`
- `invalidated_at`
- `invalidation_reason`

Recommended constraints:

- unique `installation_id`
- index on `user_id`
- index on active `push_token`

Recommended behavior:

- `PUT` upserts by `installation_id`
- if the same installation logs into another account, reassign ownership to the current authenticated user
- `DELETE` marks the installation inactive instead of hard deleting immediately

## Delivery pipeline recommendation

Use the Expo push service first. It is the simplest integration for an Expo app.

Recommended backend flow:

1. read active installations for the target user
2. send notifications to Expo in batches
3. persist Expo ticket IDs
4. later fetch push receipts
5. if Expo reports the token as invalid or unregistered, deactivate that installation

This keeps delivery reliable and prevents repeated sends to dead tokens.

## Client-side vs backend-owned concerns

### Backend-owned

- active installation registrations
- which user/device combinations are eligible to receive pushes
- notification records shown in the inbox
- message delivery attempts
- invalid token cleanup

### Client-owned

- OS notification permission prompt UX
- local notification presentation behavior
- badge presentation rules in the app
- foreground handling behavior
- local storage of the installation ID
- whether the device currently exposes a fresh token before registration

## Existing endpoints

The rest of v1 still makes sense:

- `GET /home`
- `GET /profile`
- `PATCH /profile`
- `GET /wallet`
- `GET /wallet/transactions`
- `GET /wallet/transactions/{transactionId}`
- `POST /wallet/transfers`
- `GET /barcode`
- `GET /v1/locations/collection-points`

## Profile personal payload

`GET /profile` returns `personal.phoneNumber` and `PATCH /profile` accepts it.

Use canonical E.164 format, for example `+351912345678`.

## Barcode payload

`GET /barcode` returns a short-lived `reference` plus `expiresAt`.

The mobile client should treat `expiresAt` as the source of truth for the QR countdown and request a fresh barcode when the current one expires.

## Summary

The best integration is:

- keep inbox APIs under `/notifications`
- add a separate installation-based push registration API
- use `PUT` for idempotent registration
- use `DELETE` for logout / revoke cleanup
- keep push tokens out of user profile payloads
- support multiple devices from day one

## Files

- `docs/volta-mobile-api-v1.1.openapi.yaml`
- `docs/volta-mobile-api-v1.1.md`
