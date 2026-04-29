# `qnsp` PyPI publish runbook

The `qnsp` package on PyPI is published from the
[`publish-python-sdks.yml`](../../../.github/workflows/publish-python-sdks.yml)
GitHub Actions workflow on every `main` push that touches
`sdks/python/**`. The workflow uses **PyPI trusted publishing (OIDC)**,
which avoids storing long-lived API tokens in GitHub Secrets.

For the **first** publish of a new package name, PyPI requires a one-time
manual configuration before the workflow can succeed. After that the
workflow runs automatically.

## One-time PyPI setup (required before the first publish)

The workflow currently fails with `TrustedPublishingFailure` because no
trusted-publisher binding exists for `qnsp`. Configure it once:

1. **Create a stub package on PyPI** (only needed if the project does
   not exist yet — once a maintainer with credentials uploads a tarball
   PyPI will reserve the name). Skip if the project already exists.

2. **Open the trusted-publisher configuration page** on PyPI:

   - Go to <https://pypi.org/manage/account/publishing/>
   - Click **Add a new pending publisher** (if `qnsp` does not yet
     exist on PyPI) or open the existing project and **Add a publisher**.

3. **Enter exactly these values** (case-sensitive):

   | Field | Value |
   |---|---|
   | PyPI Project Name | `qnsp` |
   | Owner | `cuilabs` |
   | Repository name | `qnsp` |
   | Workflow name | `publish-python-sdks.yml` |
   | Environment name | `pypi-publish` |

   (Owner is `cuilabs` because the workflow runs from the private
   `cuilabs/qnsp` monorepo, not the public mirror. The OIDC token's
   `repository` claim points at the source repo, not where the source
   is mirrored to.)

4. **Save**. PyPI immediately recognises future workflow runs from the
   matching repo + workflow + environment combo.

## Verifying the binding worked

After the binding is saved, retrigger the workflow on the most recent
commit that touched `sdks/python/**`:

```bash
gh workflow run publish-python-sdks.yml --ref main
gh run watch
```

Expected outcome: a successful upload to <https://pypi.org/project/qnsp/>.
Confirm with:

```bash
pip index versions qnsp        # should list the published version
pip install qnsp==<version>    # smoke install in a clean venv
```

## When to bump the version

The `publish-python-sdks.yml` workflow uses Twine's `--skip-existing`
flag, so re-running the workflow on the same version is a no-op (no
error, no upload). To trigger a real publish:

1. Bump `version` in
   [`sdks/python/qnsp/pyproject.toml`](pyproject.toml).
2. Add a new entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Commit + push to `main`. The path filter on `sdks/python/**` will
   re-trigger the workflow automatically.

## Production billing-service activation gate

`qnsp` v0.2.0+ calls `/billing/v1/sdk/activate` on first use with
`sdkId="qnsp-python"`. That sdkId was added to
[`packages/sdk-activation/src/types.ts`](../../../packages/sdk-activation/src/types.ts)
and to billing-service's mirror schema in
[`apps/billing-service/src/routes/sdk-activation-schemas.ts`](../../../apps/billing-service/src/routes/sdk-activation-schemas.ts)
in commit
[`2c2d2b78`](https://github.com/cuilabs/qnsp-public/commit/2c2d2b78). For
the gate to succeed end-to-end, billing-service must be redeployed so
production runs the updated enum:

```bash
AWS_PROFILE=qnsp-deploy python3 scripts/ops/deploy-backend-prod.py --services billing-service
```

Without that deploy, freshly-installed `qnsp` packages in production
clients hitting `https://api.qnsp.cuilabs.io/billing/v1/sdk/activate`
will receive `INVALID_SDK_ID`.

## Yanking a bad release

If a bad version reaches PyPI:

```bash
# requires PyPI maintainer credentials interactively or via ~/.pypirc
twine upload --skip-existing dist/*  # standard reupload still no-op
# yanking is a UI-only action on https://pypi.org/manage/project/qnsp/release/<version>/
```

PyPI yanks remove the version from `pip install qnsp` defaults (so
`pip install qnsp` on a fresh resolve will not pick the yanked version)
but leave the version installable via pinned `pip install qnsp==<yanked>`.
This is the right tool for "this version is broken, please don't use it"
without breaking pinned reproducible builds elsewhere.
