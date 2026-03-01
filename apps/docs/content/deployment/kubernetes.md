---
title: Kubernetes Deployment
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Kubernetes Deployment

Deploy QNSP on Kubernetes.

## Supported distributions

- Amazon EKS
- Google GKE
- Azure AKS
- OpenShift
- Rancher
- Vanilla Kubernetes 1.28+

## Helm installation

Kubernetes deployment artifacts (charts/manifests) are not shipped in this repo.

For production Kubernetes deployments (EKS/GKE/AKS/OpenShift), contact support for the supported deployment bundle and configuration guidance.

## Namespace structure

The following layout is illustrative and depends on your deployment bundle.

```
qnsp/
├── qnsp-edge-gateway
├── qnsp-auth-service
├── qnsp-kms-service
├── qnsp-vault-service
├── qnsp-storage-service
├── qnsp-audit-service
└── qnsp-search-service
```

## Resource configuration

Example values are deployment-specific.

```yaml
resources:
  edgeGateway:
    requests:
      cpu: "2"
      memory: "4Gi"
    limits:
      cpu: "4"
      memory: "8Gi"
```

## Scaling

### Horizontal Pod Autoscaler

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilization: 70
```

### Pod Disruption Budget

```yaml
podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

## Network policies

Network policy snippets are illustrative only.

```yaml
networkPolicies:
  enabled: true
  # Only allow traffic from ingress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: ingress-nginx
```

## Secrets management

Secrets provider integration is deployment-specific.

```yaml
secrets:
  provider: kubernetes  # or vault, aws-secrets-manager
