---
title: "Host Agents"
description: "Deploy the QNSP Host Agent to discover cryptographic assets across your server fleet and report them to the QNSP platform."
version: 0.1.0
last_updated: 2026-03-06
copyright: © 2025 CUI Labs. All rights reserved.
license: BSL-1.1
source_files:
  - /apps/qnsp-agent/src/index.ts
  - /apps/qnsp-agent/src/config.ts
  - /apps/qnsp-agent/src/scanner.ts
  - /apps/qnsp-agent/src/reporter.ts
  - /apps/crypto-inventory-service/src/routes/agents.ts
  - /apps/crypto-inventory-service/src/services/agent-auth.ts
---

# Host Agents

The QNSP Host Agent is a lightweight CLI daemon that discovers cryptographic assets on your servers — SSH keys, TLS certificates, PKCS#12/JKS keystores, and active TLS endpoints — and reports them to the QNSP platform for inventory, exposure analysis, and PQC migration planning.

## Prerequisites

- Node.js 20 or later
- An active QNSP tenant
- `host-agent-ingestion` feature enabled for your tenant (contact your account team if not enabled)
- `tenant_admin` role to register agents

## Quick Start

### 1. Register an agent

In the QNSP portal, navigate to **Crypto Posture → Host Agents → Register Agent**.

Give the agent a name (e.g. `web-01-prod`) and click **Register Agent**. You will receive:

- **Agent ID** — a UUID identifying this agent
- **Agent Secret** — a 64-character hex string shown **once only**. Store it securely.

Alternatively, register via the API:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "x-qnsp-tenant-id: $TENANT_ID" \
  -d '{"name": "web-01-prod"}' \
  https://api.qnsp.cuilabs.io/proxy/crypto/v1/agents
```

Response:

```json
{
  "agent": {
    "id": "<agent-uuid>",
    "name": "web-01-prod",
    "status": "active",
    "labels": {},
    "lastSeenAt": null,
    "createdAt": "2026-03-06T00:00:00.000Z",
    "updatedAt": "2026-03-06T00:00:00.000Z"
  },
  "secret": "<64-char-hex-secret>",
  "warning": "Store this secret securely. It will not be shown again."
}
```

### 2. Install the agent

```bash
npm install -g @qnsp/agent
```

Requires Node.js 20+. The package installs the `qnsp-agent` binary globally.

### 3. Configure the agent

Run the interactive setup wizard:

```bash
qnsp-agent configure
```

Or set environment variables directly:

```bash
export QNSP_AGENT_ID=<agent-uuid>
export QNSP_AGENT_SECRET=<64-char-hex-secret>
export QNSP_ENDPOINT=https://api.qnsp.cuilabs.io
export QNSP_TENANT_ID=<tenant-uuid>
```

Or create a config file at `~/.qnsp-agent/config.env`:

```env
QNSP_AGENT_ID=<agent-uuid>
QNSP_AGENT_SECRET=<64-char-hex-secret>
QNSP_ENDPOINT=https://api.qnsp.cuilabs.io
QNSP_TENANT_ID=<tenant-uuid>
```

### 4. Run a scan

```bash
# Run once and exit
qnsp-agent run

# Run continuously on the configured interval (default: 5 minutes)
qnsp-agent daemon
```

## Configuration Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `QNSP_AGENT_ID` | ✅ | — | Agent UUID from the QNSP portal |
| `QNSP_AGENT_SECRET` | ✅ | — | 64-char hex secret from registration |
| `QNSP_ENDPOINT` | ✅ | — | `https://api.qnsp.cuilabs.io` |
| `QNSP_TENANT_ID` | ✅ | — | Your tenant UUID |
| `QNSP_SCAN_PATHS` | ❌ | `/etc/ssl,/etc/pki,/etc/ssh,/home,/root,...` | Comma-separated paths to scan |
| `QNSP_INTERVAL_SECS` | ❌ | `300` | Report interval in daemon mode (30–86400) |
| `QNSP_LOG_LEVEL` | ❌ | `info` | `silent`, `error`, `warn`, `info`, `debug` |
| `QNSP_HOSTNAME` | ❌ | `os.hostname()` | Override the reported hostname |

## What the Agent Discovers

| Asset Type | Examples |
|---|---|
| SSH private keys | `id_rsa`, `id_ecdsa`, `id_ed25519`, `*.key` |
| X.509 certificates | `*.pem`, `*.crt`, `*.cer`, `*.der` |
| PKCS#12 keystores | `*.p12`, `*.pfx` |
| JKS keystores | `*.jks`, `*.keystore` |
| JWT signing keys | Files matching `jwt*.pem`, `signing*.pem` |
| TLS endpoints | Active TLS listeners on common ports (443, 8443, etc.) |

For each asset, the agent reports: type, file path, algorithm, key size (where applicable), expiry date (for certificates), subject/issuer (for certificates), and a SHA-256 fingerprint.

## Running as a System Service

### systemd (Linux)

```ini
[Unit]
Description=QNSP Host Agent
After=network.target

[Service]
ExecStart=/usr/local/bin/qnsp-agent daemon
EnvironmentFile=/etc/qnsp-agent/config.env
Restart=always
RestartSec=30
User=qnsp-agent

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now qnsp-agent
```

### launchd (macOS)

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN"
  "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>io.cuilabs.qnsp-agent</string>
  <key>ProgramArguments</key>
  <array>
    <string>/usr/local/bin/qnsp-agent</string>
    <string>daemon</string>
  </array>
  <key>EnvironmentVariables</key>
  <dict>
    <key>QNSP_AGENT_ID</key>     <string>YOUR_AGENT_ID</string>
    <key>QNSP_AGENT_SECRET</key> <string>YOUR_AGENT_SECRET</string>
    <key>QNSP_ENDPOINT</key>     <string>https://api.qnsp.cuilabs.io</string>
    <key>QNSP_TENANT_ID</key>    <string>YOUR_TENANT_ID</string>
  </dict>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <true/>
</dict>
</plist>
```

## Agent Status Values

| Status | Meaning |
|---|---|
| `active` | Agent is registered and can submit reports |
| `disabled` | Agent is temporarily suspended — reports will be rejected |
| `revoked` | Agent access is permanently revoked — cannot be re-activated |

## Security Model

The agent authenticates each report using HMAC-SHA256:

1. The bootstrap secret is never stored in plaintext on the server. The server stores `SHA-256(secret)` as the HMAC key.
2. For each report, the agent computes: `HMAC-SHA256(SHA-256(secret), timestamp + "." + nonce + "." + SHA-256(body))`
3. The server verifies the signature, checks the timestamp is within ±300 seconds, and enforces nonce uniqueness (anti-replay).
4. Reports are rejected if the agent is `disabled` or `revoked`.

The agent secret is shown **once** at registration. If lost, rotate it via **Crypto Posture → Host Agents → Rotate Secret** or the API:

```bash
curl -sS -X POST \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "x-qnsp-tenant-id: $TENANT_ID" \
  https://api.qnsp.cuilabs.io/proxy/crypto/v1/agents/<agent-id>/rotate
```

## CLI Commands

```
qnsp-agent run         Scan the host and submit a report, then exit
qnsp-agent daemon      Run continuously on the configured interval
qnsp-agent configure   Interactive setup wizard
qnsp-agent status      Print current configuration (no secrets printed)
qnsp-agent version     Print version
qnsp-agent help        Print help
```

## Troubleshooting

**`Invalid agent configuration`** — One or more required environment variables are missing or invalid. Run `qnsp-agent status` to see the current config (secrets are not printed).

**`Report rejected (401)`** — The agent secret is wrong or the agent ID does not exist. Re-register or rotate the secret.

**`Report rejected (403)`** — The `host-agent-ingestion` feature is not enabled for your tenant, or the agent belongs to a different tenant.

**`Agent is not active`** — The agent has been `disabled` or `revoked`. Re-enable it in the portal or register a new agent.

**`Nonce already used (replay detected)`** — The same request was submitted twice within 10 minutes. This is a no-op — the first submission was accepted.

**`Timestamp outside acceptable range`** — The system clock on the agent host is more than 5 minutes out of sync. Sync the clock with NTP.
