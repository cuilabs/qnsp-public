---
title: CLI in CI/CD
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# CLI in CI/CD

Using QNSP CLI in CI/CD pipelines.

## GitHub Actions

```yaml
name: Deploy with QNSP

on: [push]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Install QNSP CLI
        run: pnpm add -g @qnsp/cli
      
      - name: Configure QNSP
        env:
          QNSP_TENANT_ID: ${{ secrets.QNSP_TENANT_ID }}
          QNSP_SERVICE_ID: ${{ secrets.QNSP_SERVICE_ID }}
          QNSP_SERVICE_SECRET: ${{ secrets.QNSP_SERVICE_SECRET }}
        run: |
          # Optional: explicitly request a token (most commands will do this automatically)
          qnsp auth token --service-id $QNSP_SERVICE_ID --service-secret $QNSP_SERVICE_SECRET --output json
      
      - name: Fetch secrets
        run: |
          qnsp vault secrets get $QNSP_SECRET_ID --output json > db-password.json
```

## GitLab CI

```yaml
deploy:
  image: node:20
  before_script:
    - corepack enable && corepack prepare pnpm@10.25.0 --activate && pnpm add -g @qnsp/cli
  script:
    - qnsp vault secrets get $QNSP_SECRET_ID --output json > api-key.json
  variables:
    QNSP_TENANT_ID: $QNSP_TENANT_ID
```

## Jenkins

```groovy
pipeline {
    agent any
    environment {
        QNSP_TENANT_ID = credentials('qnsp-tenant-id')
        QNSP_SERVICE_ID = credentials('qnsp-service-id')
        QNSP_SERVICE_SECRET = credentials('qnsp-service-secret')
    }
    stages {
        stage('Setup') {
            steps {
                sh 'corepack enable && corepack prepare pnpm@10.25.0 --activate'
                sh 'pnpm add -g @qnsp/cli'
                sh 'qnsp auth token --service-id $QNSP_SERVICE_ID --service-secret $QNSP_SERVICE_SECRET --output json'
            }
        }
        stage('Deploy') {
            steps {
                sh 'qnsp vault secrets get $QNSP_SECRET_ID --output json > deploy-key.json'
            }
        }
    }
}
```

## CircleCI

```yaml
version: 2.1

jobs:
  deploy:
    docker:
      - image: cimg/node:20.0
    steps:
      - checkout
      - run:
          name: Install QNSP CLI
          command: |
            corepack enable
            corepack prepare pnpm@10.25.0 --activate
            pnpm add -g @qnsp/cli
      - run:
          name: Fetch secrets
          command: |
            qnsp auth token --service-id $QNSP_SERVICE_ID --service-secret $QNSP_SERVICE_SECRET --output json
            qnsp vault secrets get $QNSP_SECRET_ID --output json
```
