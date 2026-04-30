//! QNSP Auth — JWT issuance, refresh, revocation, WebAuthn passkeys, MFA,
//! federated identity (SAML / OIDC), risk-based authentication.

use reqwest::Method;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::activation::Activation;
use crate::errors::Error;
use crate::service_client::ServiceClient;

const PATH_PREFIX: &str = "/auth/v1";

#[derive(Clone)]
pub struct Client {
    sc: ServiceClient,
}

impl Client {
    pub fn new(activation: Arc<Activation>, http: reqwest::Client) -> Self {
        Self { sc: ServiceClient::new(activation, http, PATH_PREFIX) }
    }

    pub async fn login(&self, req: LoginRequest) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/login", Some(&req), None, None).await
    }

    pub async fn refresh_token(&self, refresh_token: &str) -> Result<Value, Error> {
        #[derive(Serialize)]
        struct Body<'a> {
            #[serde(rename = "refreshToken")]
            refresh_token: &'a str,
        }
        self.sc
            .request(Method::POST, "/refresh", Some(&Body { refresh_token }), None, None)
            .await
    }

    pub async fn revoke(&self, refresh_token: &str) -> Result<(), Error> {
        #[derive(Serialize)]
        struct Body<'a> {
            #[serde(rename = "refreshToken")]
            refresh_token: &'a str,
        }
        self.sc
            .request(Method::POST, "/revoke", Some(&Body { refresh_token }), None, None)
            .await?;
        Ok(())
    }

    // ── WebAuthn passkeys ────────────────────────────────────────────

    pub async fn register_passkey_start(&self, user_id: &str, tenant_id: &str) -> Result<Value, Error> {
        #[derive(Serialize)]
        struct Body<'a> {
            #[serde(rename = "userId")]
            user_id: &'a str,
            #[serde(rename = "tenantId")]
            tenant_id: &'a str,
        }
        self.sc
            .request(Method::POST, "/passkeys/register/start", Some(&Body { user_id, tenant_id }), None, None)
            .await
    }

    pub async fn register_passkey_complete(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc
            .request(Method::POST, "/passkeys/register/complete", Some(&Value::Object(body)), None, None)
            .await
    }

    pub async fn authenticate_passkey_start(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc
            .request(Method::POST, "/passkeys/authenticate/start", Some(&Value::Object(body)), None, None)
            .await
    }

    pub async fn authenticate_passkey_complete(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc
            .request(Method::POST, "/passkeys/authenticate/complete", Some(&Value::Object(body)), None, None)
            .await
    }

    pub async fn list_passkeys(&self, user_id: &str, tenant_id: &str) -> Result<Value, Error> {
        let q = [("userId", user_id.to_string()), ("tenantId", tenant_id.to_string())];
        self.sc.request::<()>(Method::GET, "/passkeys", None, Some(&q), None).await
    }

    pub async fn delete_passkey(&self, credential_id: &str) -> Result<(), Error> {
        self.sc
            .request::<()>(Method::DELETE, &format!("/passkeys/{}", credential_id), None, None, None)
            .await?;
        Ok(())
    }

    // ── MFA ──────────────────────────────────────────────────────────

    pub async fn mfa_challenge(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/mfa/challenge", Some(&Value::Object(body)), None, None).await
    }

    pub async fn mfa_verify(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/mfa/verify", Some(&Value::Object(body)), None, None).await
    }

    // ── Federated identity ──────────────────────────────────────────

    pub async fn federate_saml(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/federate/saml", Some(&Value::Object(body)), None, None).await
    }

    pub async fn federate_oidc(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/federate/oidc", Some(&Value::Object(body)), None, None).await
    }

    // ── Risk-based auth ──────────────────────────────────────────────

    pub async fn evaluate_risk(&self, body: serde_json::Map<String, Value>) -> Result<Value, Error> {
        self.sc.request(Method::POST, "/risk/evaluate", Some(&Value::Object(body)), None, None).await
    }

    pub async fn list_risk_policies(&self, tenant_id: &str) -> Result<Value, Error> {
        let q = [("tenantId", tenant_id.to_string())];
        self.sc.request::<()>(Method::GET, "/risk/policies", None, Some(&q), None).await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
    #[serde(rename = "tenantId")]
    pub tenant_id: String,
}
