package qnsp

import "github.com/cuilabs/qnsp-public/sdks/go/qnsp/internal/qnspcore"

// Error is the root type for all QNSP SDK errors.
type Error = qnspcore.Error

// NetworkError covers DNS, TLS, timeout, and connection failures reaching
// the QNSP edge gateway.
type NetworkError = qnspcore.NetworkError

// AuthError is returned when activation fails because the API key is
// rejected by billing-service.
type AuthError = qnspcore.AuthError

// APIError wraps a structured 4xx/5xx response from a QNSP service.
type APIError = qnspcore.APIError

// WebhookError is returned by ParseWebhook / VerifyWebhookSignature when
// the request fails HMAC verification, replay protection, or shape checks.
type WebhookError = qnspcore.WebhookError
