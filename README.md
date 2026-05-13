# QNSP Public Surface

This repository is an automatically published subset of the private QNSP monorepo.

Included:

- Documentation markdown content: `apps/docs/content/`
- Public TypeScript SDK and CLI sources under `packages/` (Apache-2.0 licensed per package)
- Python SDK source under `sdks/python/qnsp/` (published to PyPI as `qnsp`)
- Go SDK source under `sdks/go/qnsp/` (consumed via `go get github.com/cuilabs/qnsp-public/sdks/go/qnsp`)
- Rust SDK source under `sdks/rust/qnsp/` (published to crates.io as `qnsp`)

Excluded:

- Core services and infrastructure code
- Confidential internal documentation (`docs/private/`)
- Secrets and environment files

Source revision:

- `68d8b544eadb142905cf90a91fdf0af3931ac127`

