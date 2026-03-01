---
title: Authentication Flows
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Authentication Flows

QNSP supports multiple authentication flows depending on identity type.

## User authentication

### Password flow
```
POST /auth/login
{
  "email": "user@example.com",
  "tenantId": "<tenant_uuid>",
  "password": "..."
}
```

Returns access token + refresh token.

### WebAuthn flow
1. `POST /auth/webauthn/authenticate/start` — get challenge
2. Client signs with authenticator
3. `POST /auth/webauthn/authenticate/complete` — verify and get tokens

### Federated flow (OIDC)
1. Redirect to IdP
2. IdP callback with code
3. `POST /auth/federation/oidc/callback` — exchange for QNSP tokens

## Service authentication

### Service token flow
```
POST /auth/service-token
Authorization: Bearer <service-secret>
{
  "serviceId": "<uuid>",
  "audience": "internal-service"
}
```

Returns access token only (no refresh).

## Token refresh

```
POST /auth/token/refresh
{
  "refreshToken": "<token>"
}
```

Returns new access token + rotated refresh token.

## Organization access (C2)

### Request-to-join (public)

Users who are not yet members can request access through edge-gateway:

```
POST /public/join-requests
{
  "tenant": "<tenant_slug_or_uuid>",
  "email": "user@company.com",
  "requestedRole": "Developer"
}
```

### Invite acceptance (password reset)

Invites are implemented as a locked user created in auth-service, followed by a password reset email.

- `POST /auth/forgot-password` sends reset email
- `POST /auth/reset-password` sets the new password

On first successful reset, auth-service activates invited users:

- `locked` → `active`
