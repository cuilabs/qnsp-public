# docs CI Gates

This is documentation. **Do NOT do test coverage.**

## Required CI Gates

### 1. Markdown Linting
```bash
pnpm markdownlint "**/*.md" --ignore node_modules
```

### 2. Link Checking
```bash
pnpm linkcheck
# or
npx linkinator . --recurse --skip "localhost|127.0.0.1"
```

### 3. Build
```bash
pnpm build
```

### 4. Spell Check (Optional)
```bash
pnpm cspell "**/*.md"
```

## CI Workflow Example

```yaml
docs:
  steps:
    - run: pnpm markdownlint "**/*.md" --ignore node_modules
    - run: pnpm build
    - run: npx linkinator ./dist --recurse --skip "localhost"
```

## What NOT to Do

- ❌ Add Vitest coverage thresholds
- ❌ Write unit tests for documentation
- ❌ Chase coverage metrics

## What TO Do

- ✅ Keep docs up to date with code changes
- ✅ Ensure all links work
- ✅ Ensure docs build successfully
- ✅ Review docs in PR previews
