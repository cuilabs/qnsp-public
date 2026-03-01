---
title: SAML Federation
version: 0.0.1
last_updated: 2025-12-24
copyright: 2025 CUI Labs. All rights reserved.
---
# SAML Federation

QNSP supports SAML 2.0 for enterprise SSO.

## Configuration

Register a SAML federation provider:

```json
{
  "id": "saml-main",
  "provider": "saml",
  "name": "Example SAML IdP",
  "enabled": true,
  "metadata": {
    "entityId": "https://idp.example.com",
    "ssoUrl": "https://idp.example.com/sso",
    "certificate": "<certificate_pem_or_base64>"
  }
}
```

## Flow

1. Your SSO integration produces a validated assertion payload.
2. Submit the assertion to QNSP:
   ```
   POST /auth/federation/saml/assertion
   {
     "providerId": "saml-main",
     "externalUserId": "<external_user_id>",
     "email": "user@example.com",
     "tenantId": "<tenant_uuid>",
     "roles": ["member"],
     "attributes": {}
   }
   ```
3. QNSP issues access + refresh tokens.

## Attribute mapping

Map SAML attributes to QNSP:

| SAML Attribute | QNSP Attribute |
|----------------|----------------|
| `NameID` | External ID |
| `email` | Email |
| `displayName` | Display name |
| `memberOf` | Roles |

## SP metadata

QNSP exposes SP metadata at:
```
GET /auth/federation/:providerId/metadata?type=saml
```

## Security

- Assertions must be signed
- Encryption supported but optional
