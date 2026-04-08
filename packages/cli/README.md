# @qnsp/cli

Command-line interface for the QNSP platform — full coverage for all 13 services.

## Quick Start

1. **Create a QNSP account** at <https://cloud.qnsp.cuilabs.io/auth> — one click with GitHub or Google, or use email
2. **Sign in** and copy your Tenant ID from **Settings → Tenant**
3. **Generate an API key** at <https://cloud.qnsp.cuilabs.io/api-keys>
4. Install and configure:

```bash
pnpm add -g @qnsp/cli
```

```bash
export QNSP_TENANT_ID="your-tenant-id"
export QNSP_SERVICE_ID="your-service-id"
export QNSP_SERVICE_SECRET="your-service-secret"

qnsp vault list
qnsp kms list-keys
qnsp audit list-events --topic storage.document.uploaded
```

## Requirements

- Node.js >= 24.12.0 (`engines` in `package.json`)

## Installation

```bash
pnpm add -g @qnsp/cli
```

## Usage

```bash
qnsp --help
```

## Service Coverage

Complete CLI commands for all QNSP services:

### Core Services
- **Auth** - Service token authentication
- **KMS** - Key management (list, get, create)
- **Vault** - Secret management (list, get)
- **Audit** - Event logging and querying

### Data Services
- **Storage** - Object storage operations
- **Search** - Full-text search and indexing

### Platform Services
- **Tenant** - Tenant management
- **Billing** - Add-on management and usage tracking
- **Access Control** - Policy management
- **Observability** - Metrics and traces
- **Security** - Incident and breach detection

## Configuration

Environment variables:

- `QNSP_AUTH_SERVICE_URL` - Auth service URL (default: http://localhost:8081)
- `QNSP_SERVICE_ID` - Service account ID
- `QNSP_SERVICE_SECRET` - Service account secret
- `QNSP_TENANT_ID` - Tenant identifier
- `QNSP_KMS_SERVICE_URL` - KMS service URL (default: http://localhost:8095)
- `QNSP_VAULT_SERVICE_URL` - Vault service URL (default: http://localhost:8090)
- `QNSP_AUDIT_SERVICE_URL` - Audit service URL (default: http://localhost:8103)
- `QNSP_STORAGE_SERVICE_URL` - Storage service URL (default: http://localhost:8092)
- `QNSP_SEARCH_SERVICE_URL` - Search service URL (default: http://localhost:8091)
- `QNSP_TENANT_SERVICE_URL` - Tenant service URL (default: http://localhost:8108)
- `QNSP_BILLING_SERVICE_URL` - Billing service URL (default: http://localhost:8109)
- `QNSP_ACCESS_CONTROL_SERVICE_URL` - Access control URL (default: http://localhost:8104)
- `QNSP_OBSERVABILITY_SERVICE_URL` - Observability URL (default: http://localhost:8105)
- `QNSP_SECURITY_MONITORING_SERVICE_URL` - Security monitoring URL (default: http://localhost:8106)
- `QNSP_OUTPUT_FORMAT` - Output format: json, table, yaml (default: table)
- `QNSP_VERBOSE` - Enable verbose output

## Testing

```bash
pnpm test
```

**Test Coverage**: 31 tests across 6 test suites
- Unit tests for config, auth, output utilities
- Integration tests for KMS, Vault, Audit commands

## Related Documentation

- [API Reference](https://docs.qnsp.cuilabs.io/api)
- [SDK Overview](https://docs.qnsp.cuilabs.io/sdk/overview)
- [CLI Quickstart](https://docs.qnsp.cuilabs.io/cli)

## License

Licensed under the Apache License, Version 2.0. See [`LICENSE`](../../LICENSE.md).

© 2026 QNSP — CUI LABS, Singapore
