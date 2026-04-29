//! Internal shared HTTP plumbing for the public service modules.
//! End users should call `Client::vault()`, `Client::kms()`, or
//! `Client::audit()` rather than construct this directly.

use reqwest::{Method, StatusCode};
use serde::Serialize;
use serde_json::Value;
use std::sync::Arc;

use crate::activation::{parse_api_error, Activation};
use crate::errors::{Error, NetworkError};

#[derive(Clone)]
pub struct ServiceClient {
    pub activation: Arc<Activation>,
    pub http: reqwest::Client,
    pub path_prefix: &'static str,
}

impl ServiceClient {
    pub fn new(
        activation: Arc<Activation>,
        http: reqwest::Client,
        path_prefix: &'static str,
    ) -> Self {
        Self {
            activation,
            http,
            path_prefix,
        }
    }

    pub async fn request<B: Serialize>(
        &self,
        method: Method,
        path: &str,
        body: Option<&B>,
        query: Option<&[(&str, String)]>,
        idempotency_key: Option<&str>,
    ) -> Result<Value, Error> {
        // Lazy activation — first call exercises the handshake.
        self.activation.get().await?;

        let resp = self.send(method.clone(), path, body, query, idempotency_key).await?;

        let resp = if resp.status() == StatusCode::UNAUTHORIZED {
            self.activation.invalidate();
            self.activation.get().await?;
            self.send(method, path, body, query, idempotency_key).await?
        } else {
            resp
        };

        let status = resp.status();
        let url = resp.url().to_string();
        let body_text = resp.text().await.map_err(|e| NetworkError {
            op: "read body".into(),
            url,
            cause: e.to_string(),
        })?;

        if !status.is_success() {
            return Err(parse_api_error(status, &body_text).into());
        }

        if status == StatusCode::NO_CONTENT || body_text.is_empty() {
            return Ok(Value::Object(serde_json::Map::new()));
        }

        let parsed: Value = serde_json::from_str(&body_text).map_err(|_| crate::errors::ApiError {
            status_code: status.as_u16(),
            code: None,
            message: "response is not valid JSON".into(),
            body: None,
        })?;

        Ok(parsed)
    }

    async fn send<B: Serialize>(
        &self,
        method: Method,
        path: &str,
        body: Option<&B>,
        query: Option<&[(&str, String)]>,
        idempotency_key: Option<&str>,
    ) -> Result<reqwest::Response, NetworkError> {
        let url = format!("{}{}{}", self.activation.base_url(), self.path_prefix, path);
        let mut req = self
            .http
            .request(method.clone(), &url)
            .header("authorization", self.activation.auth_header())
            .header("accept", "application/json");
        if let Some(b) = body {
            req = req.json(b);
        }
        if let Some(q) = query {
            req = req.query(q);
        }
        if let Some(key) = idempotency_key {
            req = req.header("idempotency-key", key);
        }
        req.send().await.map_err(|e| NetworkError {
            op: method.to_string(),
            url,
            cause: e.to_string(),
        })
    }
}
