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

### OAuth / Social Sign-In (GitHub, Google)

One-click sign-up and sign-in via GitHub or Google. Handled entirely by the Cloud Portal BFF — no direct auth-service API calls required from the client.

1. User navigates to `GET /api/auth/oauth/{provider}` (`provider` = `github` or `google`)
2. BFF generates a CSRF state (HMAC-SHA256 nonce) and sets `qnsp_oauth_state` cookie (HttpOnly, SameSite=Lax, 10 min TTL)
3. BFF redirects to the provider's authorization endpoint:
   - **GitHub**: `https://github.com/login/oauth/authorize` — scopes `user:email read:user`
   - **Google**: `https://accounts.google.com/o/oauth2/v2/auth` — scopes `openid email profile`
4. Provider redirects to `GET /api/auth/oauth/{provider}/callback?code=…&state=…`
5. BFF verifies the CSRF state against the cookie, exchanges the `code` for an access token, and fetches the user profile from the provider API
6. **Returning user**: identity lookup via `POST /auth/oauth/identity` → session issued
7. **New user**: tenant + user provisioned via billing-service, OAuth identity linked via `POST /auth/oauth/identity/link`, then session issued
8. BFF calls `POST /auth/oauth/session` → receives PQC-signed JWT (ML-DSA) + refresh token
9. Session cookies written; user redirected to `/dashboard`

**Environment variables** (Cloud Portal):
| Variable | Description |
|---|---|
| `CLOUD_OAUTH_GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `CLOUD_OAUTH_GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret |
| `CLOUD_OAUTH_GOOGLE_CLIENT_ID` | Google OAuth app client ID |
| `CLOUD_OAUTH_GOOGLE_CLIENT_SECRET` | Google OAuth app client secret |
| `CLOUD_OAUTH_SESSION_SECRET` | HMAC secret for CSRF state signing |
| `CLOUD_PORTAL_URL` | Callback base URL (default: `https://cloud.qnsp.cuilabs.io`) |

**Sign up / sign in at:** [cloud.qnsp.cuilabs.io/auth](https://cloud.qnsp.cuilabs.io/auth)

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
