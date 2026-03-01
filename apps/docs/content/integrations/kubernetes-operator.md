---
title: Kubernetes Operator
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Kubernetes Operator

Manage QNSP resources as Kubernetes custom resources.

## Installation

The Kubernetes Operator is not shipped in this repo.

If you need a supported Kubernetes integration for managing QNSP resources, contact support for the deployment bundle and operator documentation.

## Configuration

Create credentials secret:
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: qnsp-credentials
  namespace: qnsp-system
type: Opaque
stringData:
  tenantId: "your-tenant-uuid"
  serviceId: "your-service-id"
  serviceSecret: "your-service-secret"
```

## Custom Resources

Custom Resources (CRDs) shown here are examples only and may differ across operator versions.

## Status

Check resource status:
Refer to the operator documentation provided with your deployment bundle.
