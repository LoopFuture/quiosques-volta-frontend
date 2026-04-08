# Volta Backend API

`docs/volta-backend-api.openapi.yaml` is the canonical OpenAPI snapshot for backend version `1.1.0`.
This document summarizes the current contract surface and the main integration constraints that matter to the app, admin tooling, and RVM flows.

## Scope

- All documented routes are prefixed with `/api/v1`.
- The OpenAPI title is `Volta Backend API`.
- The contract covers authenticated mobile-user endpoints, admin machine management, machine provisioning, RVM transaction ingestion, and health checks.

## Authentication Models

- `bearer`: used by authenticated user and admin routes.
- `mutual-tls`: used by RVM machine routes.
- Enrollment-token exchange for provisioning is modeled in the request body of `POST /api/v1/provisioning/certificates`.

## Endpoint Groups

### Admin Machines

- `GET /api/v1/admin/machines`
- `POST /api/v1/admin/machines`
- `GET /api/v1/admin/machines/{machineId}`
- `PATCH /api/v1/admin/machines/{machineId}`
- `DELETE /api/v1/admin/machines/{machineId}`
- `POST /api/v1/admin/machines/{machineId}/enroll`

Key payloads:

- machine records expose `id`, `serialNumber`, `status`, timestamps, and an optional `activeCertificate`
- machine creation requires `serialNumber`
- machine updates allow `displayName` and `status`
- enrollment issues a boot token used later for certificate provisioning

### Health

- `GET /api/v1/health`
- `GET /api/v1/health/ready`

The readiness endpoint returns either a success payload or a `503` dependency-failure payload.

### Mobile User Flows

- `GET /api/v1/barcode`
- `GET /api/v1/home`
- `GET /api/v1/profile`
- `PATCH /api/v1/profile`
- `GET /api/v1/wallet`
- `GET /api/v1/wallet/transactions`
- `GET /api/v1/wallet/transactions/{transactionId}`
- `POST /api/v1/wallet/transfers`

Key contract rules:

- wallet transfer creation requires an `Idempotency-Key` header
- wallet transaction listing supports `cursor`, `limit`, `status`, and `type`
- profile patching requires at least one top-level section and supports `onboarding`, `personal`, `payoutAccount`, and `preferences`
- wallet and home payloads reuse the shared money, stats, and activity-preview DTO families

### Provisioning And RVM

- `POST /api/v1/provisioning/certificates`
- `POST /api/v1/rvm/pairing`
- `POST /api/v1/rvm/transactions/{transactionSessionId}`

Key contract rules:

- certificate provisioning exchanges `machineId`, enrollment `token`, and `csrPem` for a signed client certificate plus CA certificate
- RVM pairing consumes a barcode-derived `qrRef` under mutual TLS
- RVM transaction submission sends itemized material totals and returns the credited wallet amount
- RVM errors use a dedicated error and validation schema family separate from the generic API validation payload

## Coverage Note

This snapshot does not document the earlier push-installation, notifications, or collection-point routes that were described in the previous version of this companion doc.
Treat the OpenAPI file as the canonical backend reference and any extra mock-only routes in the app as non-canonical until they are added back into the contract.

## Files

- `docs/volta-backend-api.openapi.yaml`
- `docs/volta-backend-api.md`
