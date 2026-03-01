---
title: Changelog
version: 0.0.1
last_updated: 2025-12-24
copyright: © 2025 CUI Labs. All rights reserved.
---
# Changelog

This changelog captures major milestones and curated, high-signal changes.

## Origins

QNSP was conceived, architected, and engineered starting in **Dec 2020**.

## Codebase history

The current QNSP monorepo was bootstrapped in **Nov 2025** as part of an internal consolidation effort.
Earlier iterations of the platform existed in prior internal repositories and design documents.

## Notable changes

### 2025-12

- Docs: migrate docs hub to `apps/docs` and run a multi-batch onboarding accuracy audit
- Edge Gateway: harden public route handling and proxy behavior (signup/login flows, tenant lookup)
- Security: reduce sensitive auth logging and remove committed signing material
- Release engineering: introduce and refine Changesets-based package versioning

### 2025-11

- Bootstrap the monorepo and initial workspace structure
- Introduce automated versioning with Changesets
- Establish package naming and scope conventions (including the `@qnsp/*` namespace)

## Versioning

Changes follow semantic versioning:
- **Major**: Breaking changes
- **Minor**: New features
- **Patch**: Bug fixes

## Notifications

Subscribe to updates:
- Cloud status dashboard: https://qnsp.cuilabs.io#overview
