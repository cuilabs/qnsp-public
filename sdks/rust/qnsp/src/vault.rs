//! QNSP Vault — PQC-encrypted secret storage with versioning, rotation,
//! and deletion.

use reqwest::Method;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::activation::Activation;
use crate::errors::Error;
use crate::service_client::ServiceClient;

const PATH_PREFIX: &str = "/vault/v1";

#[derive(Clone)]
pub struct Client {
    sc: ServiceClient,
}

impl Client {
    pub fn new(activation: Arc<Activation>, http: reqwest::Client) -> Self {
        Self { sc: ServiceClient::new(activation, http, PATH_PREFIX) }
    }

    pub async fn create_secret(
        &self,
        req: CreateSecretRequest,
        idempotency_key: Option<&str>,
    ) -> Result<Value, Error> {
        self.sc
            .request(Method::POST, "/secrets", Some(&req), None, idempotency_key)
            .await
    }

    pub async fn get_secret(&self, secret_id: &str) -> Result<Value, Error> {
        self.sc
            .request::<()>(Method::GET, &format!("/secrets/{}", secret_id), None, None, None)
            .await
    }

    pub async fn get_secret_version(&self, secret_id: &str, version: u64) -> Result<Value, Error> {
        self.sc
            .request::<()>(
                Method::GET,
                &format!("/secrets/{}/versions/{}", secret_id, version),
                None,
                None,
                None,
            )
            .await
    }

    pub async fn rotate_secret(
        &self,
        secret_id: &str,
        payload_b64: String,
        algorithm: Option<String>,
        idempotency_key: Option<&str>,
    ) -> Result<Value, Error> {
        #[derive(Serialize)]
        struct Body {
            #[serde(rename = "payloadB64")]
            payload_b64: String,
            #[serde(skip_serializing_if = "Option::is_none")]
            algorithm: Option<String>,
        }
        self.sc
            .request(
                Method::POST,
                &format!("/secrets/{}/rotate", secret_id),
                Some(&Body { payload_b64, algorithm }),
                None,
                idempotency_key,
            )
            .await
    }

    pub async fn delete_secret(&self, secret_id: &str) -> Result<(), Error> {
        self.sc
            .request::<()>(
                Method::DELETE,
                &format!("/secrets/{}", secret_id),
                None,
                None,
                None,
            )
            .await?;
        Ok(())
    }

    pub async fn list_secret_versions(&self, secret_id: &str) -> Result<Value, Error> {
        self.sc
            .request::<()>(
                Method::GET,
                &format!("/secrets/{}/versions", secret_id),
                None,
                None,
                None,
            )
            .await
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateSecretRequest {
    pub name: String,
    #[serde(rename = "payloadB64")]
    pub payload_b64: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub algorithm: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Map<String, Value>>,
}
