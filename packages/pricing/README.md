# @qnsp/pricing

Shared pricing types, tier limits, and add-on definitions for the [QNSP](https://cloud.qnsp.cuilabs.io) post-quantum security platform.

This package is the single source of truth consumed by `@qnsp/billing-sdk`, `@qnsp/shared-kernel`, and the cloud portal to keep tier capabilities, quotas, and entitlement flags consistent across the entire SDK surface.

## Install

```bash
npm install @qnsp/pricing
```

## Exports

- `@qnsp/pricing` — aggregated re-exports
- `@qnsp/pricing/tiers` — tier definitions, quota limits, entitlement flags
- `@qnsp/pricing/addons` — add-on product catalogue

## Example

```ts
import { getTierDefinition, listTiers } from "@qnsp/pricing/tiers";

const free = getTierDefinition("free");
console.log(free.limits.kmsKeysPerMonth); // typed tier quota
```

## License

Apache-2.0 — see [LICENSE](./LICENSE).
