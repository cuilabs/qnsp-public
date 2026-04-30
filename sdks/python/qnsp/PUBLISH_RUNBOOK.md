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

There are **two `cuilabs` namespaces** in play and they are independent:

- **PyPI Organization `cuilabs`** — owns the `qnsp` project on PyPI. This
  is what you set up via <https://pypi.org/manage/organizations/>. As of
  the time this runbook was written the org request is `REQUEST SUBMITTED`
  on the Company tier; PyPI staff approve manually.
- **GitHub organisation `cuilabs`** — the OIDC `repository` claim that the
  trusted-publisher binding accepts. This is the `cuilabs/qnsp` source
  repo (private), and it is the value PyPI checks against when authorising
  a workflow run to publish.

The two happen to share the name `cuilabs` but they are configured
separately and could differ in principle.

### Step 1 — Wait for the PyPI org request to be approved

PyPI's "Request Submitted" state is reviewed by their staff. Approval
typically takes 1–3 business days for Company-tier requests. Until the
org is approved, you cannot create the `qnsp` project under it; uploads
under your personal PyPI account would land outside the org and would
need to be transferred later.

### Step 2 — Create the trusted-publisher binding (Pending Publisher flow)

Because `qnsp` does **not yet exist** on PyPI, use the **Pending
Publisher** workflow — this lets you pre-configure trust for a project
that hasn't been uploaded yet, and the project is auto-created on the
first authorised upload.

1. After your `cuilabs` org is approved, go to
   <https://pypi.org/manage/account/publishing/> (logged in as the user
   who is a member of the `cuilabs` org).
2. Scroll to **Add a new pending publisher**.
3. Enter exactly these values (case-sensitive):

   | Field | Value |
   |---|---|
   | PyPI Project Name | `qnsp` |
   | Owner | `cuilabs` |
   | Repository name | `qnsp` |
   | Workflow name | `publish-python-sdks.yml` |
   | Environment name | `pypi-publish` |

4. **Save**. PyPI immediately recognises future workflow runs from the
   matching `(repo + workflow + environment)` combination.

> The "Owner" field is the **GitHub** organisation (where the source
> repo lives), not the PyPI organisation. They share a name in this
> case, but conceptually they are unrelated.

### Step 3 — Configure the GitHub deploy environment

The workflow uses an environment named `pypi-publish` so that
deploy-protection rules can be added later without changing the
workflow. Create the environment once:

1. Go to <https://github.com/cuilabs/qnsp/settings/environments>
2. Click **New environment** → name `pypi-publish` → save
3. (Optional, recommended for production) add a **Required reviewer**
   rule so a maintainer must approve each publish run.

If the environment doesn't exist when the workflow runs, GitHub creates
it implicitly with no protection rules — the workflow will still
succeed, but you lose the approval-gate option.

## Verifying the binding worked

After the org is approved, the pending publisher is configured, and
the GitHub `pypi-publish` environment exists, retrigger the workflow on
the most recent commit that touched `sdks/python/**`:

```bash
gh workflow run publish-python-sdks.yml --ref main
gh run watch
```

The workflow uses [`pypa/gh-action-pypi-publish@release/v1`](https://github.com/pypa/gh-action-pypi-publish),
which exchanges the GitHub OIDC token for a short-lived PyPI API token
automatically — no PyPI token is stored in GitHub Secrets.

Expected outcome: a successful upload to <https://pypi.org/project/qnsp/>.
Confirm with:

```bash
pip index versions qnsp        # should list the published version
pip install qnsp==<version>    # smoke install in a clean venv
```

If the run fails with `Trusted publishing exchange failure`, double-check
that the `Owner / Repository / Workflow / Environment` quartet on PyPI
matches the workflow's `cuilabs / qnsp / publish-python-sdks.yml /
pypi-publish` exactly (case-sensitive).

## When to bump the version

The publish action is invoked with `skip-existing: true`, so re-running
the workflow on the same version is a no-op (PyPI rejects the duplicate
upload, and the action treats it as a successful skip). To trigger a real
publish:

1. Bump `version` in
   [`sdks/python/qnsp/pyproject.toml`](pyproject.toml).
2. Add a new entry to [`CHANGELOG.md`](CHANGELOG.md).
3. Commit + push to `main`. The path filter on `sdks/python/**` will
   re-trigger the workflow automatically.

## Production billing-service activation gate (resolved 2026-04-30)

`qnsp` v0.2.0+ calls `/billing/v1/sdk/activate` on first use with
`sdkId="qnsp-python"` and `runtime="python"`. Both the sdkId and the
runtime label live in two source-of-truth files that are kept in sync:

- [`packages/sdk-activation/src/types.ts`](../../../packages/sdk-activation/src/types.ts)
- [`apps/billing-service/src/routes/sdk-activation-schemas.ts`](../../../apps/billing-service/src/routes/sdk-activation-schemas.ts)

Production billing-service was redeployed on 2026-04-30 (commit
[`112f54075b49`](https://github.com/cuilabs/qnsp-public/commit/112f54075b49),
ECS task-def `qnsp-prod-billing-service:21`) so the live schema accepts
the new enums end-to-end. Verify with:

```bash
curl -s -X POST -H 'authorization: Bearer test_invalid' \
  -H 'content-type: application/json' \
  -d '{"sdkId":"qnsp-python","sdkVersion":"0.2.0","runtime":"python"}' \
  https://api.qnsp.cuilabs.io/billing/v1/sdk/activate
# Expect: {"activated":false,"code":"INVALID_API_KEY",...}
# (Schema accepts the request; the test API key fails validation,
# which is correct for a test-invalid token.)
```

If you ever extend the `SdkIdentifier` enum or add a new runtime label,
remember to update **both** source files in the same commit and redeploy
billing-service before publishing the SDK update.

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
