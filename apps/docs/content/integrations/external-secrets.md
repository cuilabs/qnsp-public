---
title: External Secrets Operator
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# External Secrets Operator

Integrate QNSP with External Secrets Operator.

## Prerequisites

Install External Secrets Operator:
```bash
helm repo add external-secrets https://charts.external-secrets.io
helm install external-secrets external-secrets/external-secrets \
  --namespace external-secrets \
  --create-namespace
```

## Configuration

### ClusterSecretStore
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: qnsp
spec:
  provider:
    webhook:
      url: "https://api.qnsp.cuilabs.io/vault/v1/secrets/{{ .remoteRef.key }}/value"
      headers:
        Authorization:
          - "Bearer {{ .auth.token }}"
      result:
        jsonPath: "$.value"
      secrets:
        - name: credentials
          secretRef:
            name: qnsp-credentials
            namespace: external-secrets
```

### Credentials secret
```yaml
apiVersion: v1
kind: Secret
metadata:
  name: qnsp-credentials
  namespace: external-secrets
stringData:
  token: "your-access-token"
```

## Usage

### ExternalSecret
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: db-credentials
spec:
  refreshInterval: 5m
  secretStoreRef:
    name: qnsp
    kind: ClusterSecretStore
  target:
    name: db-credentials
  data:
    - secretKey: password
      remoteRef:
        key: "<secret_id>"
```

## Sync status

```bash
kubectl get externalsecrets
kubectl describe externalsecret db-credentials

```
