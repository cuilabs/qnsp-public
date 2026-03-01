---
title: OIDC Federation
version: 0.0.1
last_updated: 2025-12-24
copyright: 2025 CUI Labs. All rights reserved.
---
# OIDC Federation

QNSP supports OpenID Connect for federated authentication.

## Configuration

Register an OIDC federation provider:

```json
{
  "id": "google-oidc",
  "provider": "oidc",
  "name": "Google Workspace",
  "enabled": true,
  "metadata": {
    "issuer": "https://accounts.google.com",
    "authorizationEndpoint": "https://accounts.google.com/o/oauth2/v2/auth",
    "tokenEndpoint": "https://oauth2.googleapis.com/token",
    "userInfoEndpoint": "https://openidconnect.googleapis.com/v1/userinfo",
    "clientId": "...",
    "clientSecret": "...",
    "scopes": ["openid", "email", "profile"]
  }
}
```

## Flow

1. Your client completes an authorization code flow with the IdP.
2. Exchange the authorization code via QNSP:
   ```
   POST /auth/federation/oidc/callback
   {
     "providerId": "google-oidc",
     "code": "<authorization_code>",
     "state": "<optional_state>"
   }
   ```
3. QNSP exchanges the code for IdP tokens, fetches user info, and issues QNSP access/refresh tokens.

## Claim mapping

Map IdP claims to QNSP attributes:

| IdP Claim | QNSP Attribute |
|-----------|----------------|
| `sub` | External ID |
| `email` | Email |
| `name` | Display name |
| `groups` | Roles (if configured) |

## Supported providers

- Google Workspace
- Microsoft Entra ID
- Okta
- Auth0
- Any OIDC-compliant provider

## JIT provisioning

Users are created on first login if JIT provisioning is enabled.
