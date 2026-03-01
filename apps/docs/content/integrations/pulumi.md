---
title: Pulumi Provider
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Pulumi Provider

Manage QNSP resources with Pulumi.

The Pulumi provider is not shipped in this repo.

## Installation

Contact support for infrastructure-as-code options and supported providers.

## Configuration

```bash
pulumi config set qnsp:tenantId <tenant_uuid>
pulumi config set qnsp:serviceId <service-id>
pulumi config set --secret qnsp:serviceSecret <secret>
```

## Resources

Provider resources are deployment-bundle specific.

## Import

```bash
pulumi import qnsp:index:Key encryption-key key-uuid
```
