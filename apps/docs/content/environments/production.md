---
title: Production Environment
version: 0.0.2
last_updated: 2026-01-16
copyright: © 2025 CUI Labs. All rights reserved.
---
# Production Environment

Live production environment.

## Access

```
Base URL: https://api.qnsp.cuilabs.io
```

## Characteristics

- SLO monitoring (availability, latency, error rate)
- SLA coverage depends on subscription tier and, for Enterprise, signed agreements
- HSM-backed keys
- Multi-AZ deployment
- 24/7 monitoring

## Configuration

### Available Services

Production includes the following services, all accessible via edge-gateway:

- **Core Security**: auth-service, kms-service, vault-service, audit-service
- **Data**: storage-service, search-service, crypto-inventory-service
- **Platform**: platform-api (admin dashboard backend)
- **Control**: access-control-service, security-monitoring-service, tenant-service
- **Observability**: observability-service
- **AI**: ai-orchestrator
- **Billing**: billing-service

### SDK
```typescript
import { AuthClient } from "@qnsp/auth-sdk";
import { VaultClient } from "@qnsp/vault-sdk";

const auth = new AuthClient({
  baseUrl: "https://api.qnsp.cuilabs.io",
});

const token = await auth.requestServiceToken({
	serviceId: process.env["QNSP_SERVICE_ID"] ?? "",
	serviceSecret: process.env["QNSP_SERVICE_SECRET"] ?? "",
	audience: "internal-service",
});
if (!token) {
	throw new Error("Failed to obtain service token");
}

const vault = new VaultClient({
  baseUrl: "https://api.qnsp.cuilabs.io/proxy/vault",
  apiKey: token,
});
await vault.createSecret({ tenantId: "<tenant_uuid>", name: "example-secret", payload: "<base64_payload>" });
```

### CLI
```bash
export QNSP_EDGE_GATEWAY_URL=https://api.qnsp.cuilabs.io
export QNSP_TENANT_ID=<tenant_uuid>
export QNSP_SERVICE_ID=<service_id>
export QNSP_SERVICE_SECRET=<service_secret>
```

## Security requirements

- Use service accounts (not user credentials)
- Rotate credentials regularly
- Enable MFA for admin access
- Review audit logs

## Best practices

### Credentials
- Store in secure vault
- Never commit to code
- Use environment variables
- Rotate on schedule

### Error handling
- Implement retries
- Handle rate limits
- Log errors with request IDs
- Alert on failures

### Monitoring
- Track latency metrics
- Monitor error rates
- Set up alerts
- Review audit logs

## Support

Production issues:
- Critical: PagerDuty escalation
- High: 4-hour response
- Normal: 24-hour response
