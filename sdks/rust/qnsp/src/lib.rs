//! # qnsp — Rust SDK for the Quantum-Native Security Platform
//!
//! Typed Rust client for QNSP — post-quantum cryptography (ML-KEM, ML-DSA,
//! SLH-DSA, Falcon via liboqs), PQC-encrypted vault, server-side KMS,
//! and immutable audit trails. Same wire contracts as the official
//! `@qnsp/*` TypeScript family, the `qnsp` Python SDK, and the
//! `github.com/cuilabs/qnsp-public/sdks/go/qnsp` Go SDK — pick whichever
//! language fits your stack and the byte-for-byte outputs round-trip.
//!
//! ## Quick start
//!
//! ```no_run
//! use qnsp::{Client, ClientOptions};
//! use qnsp::vault::CreateSecretRequest;
//! use base64::{engine::general_purpose::STANDARD, Engine};
//!
//! # async fn run() -> Result<(), qnsp::Error> {
//! let c = Client::new(ClientOptions::with_api_key(std::env::var("QNSP_API_KEY").unwrap()))?;
//! let secret = c.vault().create_secret(CreateSecretRequest {
//!     name: "openai-api-key".into(),
//!     payload_b64: STANDARD.encode(b"sk-..."),
//!     algorithm: Some("ml-kem-768".into()),
//!     metadata: None,
//! }, None).await?;
//! # Ok(())
//! # }
//! ```
//!
//! Sign up for a free QNSP account at <https://cloud.qnsp.cuilabs.io/auth>.
//!
//! ## Local PQC primitives
//!
//! The optional `crypto` feature unlocks the [`crypto`] module, which
//! wraps the [`oqs`](https://crates.io/crates/oqs) crate (0.11) so the
//! algorithm-name surface matches the rest of the QNSP ecosystem. Add
//! the dependency with `cargo add qnsp --features crypto`. Building
//! requires `liboqs` source available at link time (the `oqs-sys` crate
//! can build it from source given a C toolchain + `cmake`).

mod activation;
mod errors;
mod service_client;
mod webhooks;

pub mod access;
pub mod ai;
pub mod audit;
pub mod auth;
pub mod billing;
pub mod crypto_inventory;
pub mod kms;
pub mod search;
pub mod storage;
pub mod tenant;
pub mod vault;

#[cfg(feature = "crypto")]
pub mod crypto;

pub use activation::{Activation, ActivationResult};
pub use errors::{ApiError, AuthError, Error, NetworkError, WebhookError};
pub use webhooks::{parse_webhook, verify_webhook_signature, WebhookEvent, MAX_WEBHOOK_SKEW};

use std::sync::Arc;

const DEFAULT_BASE_URL: &str = "https://api.qnsp.cuilabs.io";
pub(crate) const SDK_ID: &str = "qnsp-rust";
pub(crate) const SDK_VERSION: &str = env!("CARGO_PKG_VERSION");

/// Configuration for [`Client::new`].
#[derive(Debug, Clone)]
pub struct ClientOptions {
    /// API key issued from the QNSP cloud portal.
    pub api_key: String,
    /// Edge-gateway URL. Defaults to production.
    pub base_url: String,
    /// Per-request timeout in seconds. Defaults to 15.
    pub timeout_seconds: u64,
}

impl ClientOptions {
    /// Convenience constructor that defaults `base_url` to production and
    /// `timeout_seconds` to 15.
    pub fn with_api_key(api_key: impl Into<String>) -> Self {
        Self {
            api_key: api_key.into(),
            base_url: DEFAULT_BASE_URL.to_string(),
            timeout_seconds: 15,
        }
    }
}

/// Top-level QNSP SDK entry point.
///
/// Holds one HTTP connection pool and one [`Activation`] cache; the
/// sub-clients ([`vault::Client`], [`kms::Client`], [`audit::Client`])
/// share both. `Client` is `Clone`-cheap via internal `Arc` sharing.
#[derive(Clone, Debug)]
pub struct Client {
    activation: Arc<Activation>,
    http: reqwest::Client,
}

impl Client {
    /// Construct a new client from [`ClientOptions`]. The activation
    /// handshake runs lazily on first service call; call
    /// [`Client::ensure_activated`] to surface API-key errors at startup.
    pub fn new(opts: ClientOptions) -> Result<Self, Error> {
        if opts.api_key.trim().is_empty() {
            return Err(Error::Auth(AuthError {
                code: None,
                message: "api_key is required (sign up at https://cloud.qnsp.cuilabs.io/auth)".into(),
            }));
        }
        let http = reqwest::Client::builder()
            .timeout(std::time::Duration::from_secs(opts.timeout_seconds))
            .build()
            .map_err(|e| Error::Network(NetworkError {
                op: "build".into(),
                url: opts.base_url.clone(),
                cause: e.to_string(),
            }))?;
        let activation = Activation::new(opts.api_key, opts.base_url, http.clone());
        Ok(Self {
            activation: Arc::new(activation),
            http,
        })
    }

    /// Vault subclient — PQC-encrypted secret storage.
    pub fn vault(&self) -> vault::Client {
        vault::Client::new(self.activation.clone(), self.http.clone())
    }

    /// KMS subclient — server-side PQC keys.
    pub fn kms(&self) -> kms::Client {
        kms::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Audit subclient — immutable, hash-chained event log.
    pub fn audit(&self) -> audit::Client {
        audit::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Auth subclient — login, refresh, WebAuthn passkeys, MFA, SAML/OIDC,
    /// risk-based authentication.
    pub fn auth(&self) -> auth::Client {
        auth::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Tenant subclient — tenant CRUD, crypto-policy management,
    /// onboarding, quotas, health.
    pub fn tenant(&self) -> tenant::Client {
        tenant::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Access-control subclient — RBAC roles and permissions.
    pub fn access(&self) -> access::Client {
        access::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Billing subclient — entitlements, usage meters, invoices.
    pub fn billing(&self) -> billing::Client {
        billing::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Crypto-inventory subclient — Cryptographic Bill of Materials.
    pub fn crypto_inventory(&self) -> crypto_inventory::Client {
        crypto_inventory::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Storage subclient — PQC-encrypted object storage with SSE-X.
    pub fn storage(&self) -> storage::Client {
        storage::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Search subclient — encrypted vector search.
    pub fn search(&self) -> search::Client {
        search::Client::new(self.activation.clone(), self.http.clone())
    }

    /// AI subclient — model registry, AI workloads with enclave
    /// attestation, inference, bias / prompt-injection monitoring.
    pub fn ai(&self) -> ai::Client {
        ai::Client::new(self.activation.clone(), self.http.clone())
    }

    /// Force the activation handshake to run now. Surfaces invalid-API-key
    /// errors at startup rather than on the first service call.
    pub async fn ensure_activated(&self) -> Result<ActivationResult, Error> {
        self.activation.get().await
    }

    /// Tenant ID resolved by activation. Triggers activation on first call.
    pub async fn tenant_id(&self) -> Result<String, Error> {
        Ok(self.activation.get().await?.tenant_id)
    }

    /// Plan tier resolved by activation.
    pub async fn tier(&self) -> Result<String, Error> {
        Ok(self.activation.get().await?.tier)
    }

    /// Tier limits dict from activation.
    pub async fn limits(&self) -> Result<serde_json::Map<String, serde_json::Value>, Error> {
        Ok(self.activation.get().await?.limits)
    }

    /// Whether the tenant's plan enables a billing-side boolean feature.
    pub async fn has_feature(&self, feature: &str) -> Result<bool, Error> {
        let limits = self.limits().await?;
        Ok(limits
            .get(feature)
            .and_then(|v| v.as_bool())
            .unwrap_or(false))
    }
}
