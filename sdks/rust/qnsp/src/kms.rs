//! QNSP KMS — server-side PQC keys with sign, verify, wrap, and unwrap.

use base64::engine::general_purpose::STANDARD as B64;
use base64::Engine;
use reqwest::Method;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::sync::Arc;

use crate::activation::Activation;
use crate::errors::{ApiError, Error};
use crate::service_client::ServiceClient;

const PATH_PREFIX: &str = "/kms/v1";

#[derive(Clone)]
pub struct Client {
    sc: ServiceClient,
}

impl Client {
    pub fn new(activation: Arc<Activation>, http: reqwest::Client) -> Self {
        Self { sc: ServiceClient::new(activation, http, PATH_PREFIX) }
    }

    pub async fn create_key(
        &self,
        req: CreateKeyRequest,
        idempotency_key: Option<&str>,
    ) -> Result<Value, Error> {
        self.sc
            .request(Method::POST, "/keys", Some(&req), None, idempotency_key)
            .await
    }

    pub async fn list_keys(&self) -> Result<Value, Error> {
        self.sc
            .request::<()>(Method::GET, "/keys", None, None, None)
            .await
    }

    pub async fn get_key(&self, key_id: &str) -> Result<Value, Error> {
        self.sc
            .request::<()>(Method::GET, &format!("/keys/{}", key_id), None, None, None)
            .await
    }

    pub async fn rotate_key(
        &self,
        key_id: &str,
        idempotency_key: Option<&str>,
    ) -> Result<Value, Error> {
        self.sc
            .request::<()>(
                Method::POST,
                &format!("/keys/{}/rotate", key_id),
                None,
                None,
                idempotency_key,
            )
            .await
    }

    pub async fn delete_key(&self, key_id: &str) -> Result<(), Error> {
        self.sc
            .request::<()>(Method::DELETE, &format!("/keys/{}", key_id), None, None, None)
            .await?;
        Ok(())
    }

    pub async fn sign(
        &self,
        key_id: &str,
        data: &[u8],
        idempotency_key: Option<&str>,
    ) -> Result<Vec<u8>, Error> {
        #[derive(Serialize)]
        struct Body {
            #[serde(rename = "dataB64")]
            data_b64: String,
        }
        let resp = self
            .sc
            .request(
                Method::POST,
                &format!("/keys/{}/sign", key_id),
                Some(&Body { data_b64: B64.encode(data) }),
                None,
                idempotency_key,
            )
            .await?;
        let sig_b64 = resp
            .get("signatureB64")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ApiError {
                status_code: 200,
                code: None,
                message: "kms.sign: missing signatureB64".into(),
                body: Some(resp.clone()),
            })?;
        B64.decode(sig_b64).map_err(|_| Error::Api(ApiError {
            status_code: 200,
            code: None,
            message: "kms.sign: signatureB64 is not valid base64".into(),
            body: None,
        }))
    }

    pub async fn verify(
        &self,
        key_id: &str,
        data: &[u8],
        signature: &[u8],
    ) -> Result<bool, Error> {
        #[derive(Serialize)]
        struct Body {
            #[serde(rename = "dataB64")]
            data_b64: String,
            #[serde(rename = "signatureB64")]
            signature_b64: String,
        }
        let resp = self
            .sc
            .request(
                Method::POST,
                &format!("/keys/{}/verify", key_id),
                Some(&Body {
                    data_b64: B64.encode(data),
                    signature_b64: B64.encode(signature),
                }),
                None,
                None,
            )
            .await?;
        Ok(resp.get("valid").and_then(|v| v.as_bool()).unwrap_or(false))
    }

    pub async fn wrap(
        &self,
        key_id: &str,
        plaintext: &[u8],
        idempotency_key: Option<&str>,
    ) -> Result<Vec<u8>, Error> {
        #[derive(Serialize)]
        struct Body {
            #[serde(rename = "plaintextB64")]
            plaintext_b64: String,
        }
        let resp = self
            .sc
            .request(
                Method::POST,
                &format!("/keys/{}/wrap", key_id),
                Some(&Body { plaintext_b64: B64.encode(plaintext) }),
                None,
                idempotency_key,
            )
            .await?;
        let ct_b64 = resp
            .get("ciphertextB64")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ApiError {
                status_code: 200,
                code: None,
                message: "kms.wrap: missing ciphertextB64".into(),
                body: Some(resp.clone()),
            })?;
        B64.decode(ct_b64).map_err(|_| Error::Api(ApiError {
            status_code: 200,
            code: None,
            message: "kms.wrap: ciphertextB64 is not valid base64".into(),
            body: None,
        }))
    }

    pub async fn unwrap_(
        &self,
        key_id: &str,
        ciphertext: &[u8],
        idempotency_key: Option<&str>,
    ) -> Result<Vec<u8>, Error> {
        #[derive(Serialize)]
        struct Body {
            #[serde(rename = "ciphertextB64")]
            ciphertext_b64: String,
        }
        let resp = self
            .sc
            .request(
                Method::POST,
                &format!("/keys/{}/unwrap", key_id),
                Some(&Body { ciphertext_b64: B64.encode(ciphertext) }),
                None,
                idempotency_key,
            )
            .await?;
        let pt_b64 = resp
            .get("plaintextB64")
            .and_then(|v| v.as_str())
            .ok_or_else(|| ApiError {
                status_code: 200,
                code: None,
                message: "kms.unwrap: missing plaintextB64".into(),
                body: Some(resp.clone()),
            })?;
        B64.decode(pt_b64).map_err(|_| Error::Api(ApiError {
            status_code: 200,
            code: None,
            message: "kms.unwrap: plaintextB64 is not valid base64".into(),
            body: None,
        }))
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateKeyRequest {
    pub algorithm: String,
    pub purpose: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub metadata: Option<serde_json::Map<String, Value>>,
}
