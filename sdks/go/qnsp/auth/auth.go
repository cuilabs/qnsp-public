// Package auth is the QNSP Auth client — JWT issuance, refresh,
// revocation, WebAuthn passkeys, MFA, federated identity (SAML / OIDC),
// risk-based authentication, and federated audit.
package auth

import (
	"context"
	"net/http"
	"time"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/internal/qnspcore"
)

const pathPrefix = "/auth/v1"

// Client is the QNSP auth client.
type Client struct {
	base *qnspcore.ServiceClient
}

// New constructs an auth client.
func New(act *qnspcore.Activator, httpClient *http.Client, timeout time.Duration) *Client {
	return &Client{base: qnspcore.NewServiceClient(act, httpClient, pathPrefix, timeout)}
}

// LoginRequest is the JSON body for POST /auth/v1/login.
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	TenantID string `json:"tenantId"`
}

// Login authenticates a user with email + password and returns a TokenPair.
func (c *Client) Login(ctx context.Context, req LoginRequest) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/login", req, nil, "")
}

// RefreshToken exchanges a refresh token for a new TokenPair.
func (c *Client) RefreshToken(ctx context.Context, refreshToken string) (map[string]any, error) {
	body := map[string]any{"refreshToken": refreshToken}
	return c.base.Do(ctx, http.MethodPost, "/refresh", body, nil, "")
}

// Revoke invalidates a refresh token.
func (c *Client) Revoke(ctx context.Context, refreshToken string) error {
	body := map[string]any{"refreshToken": refreshToken}
	_, err := c.base.Do(ctx, http.MethodPost, "/revoke", body, nil, "")
	return err
}

// ── WebAuthn passkeys ────────────────────────────────────────────────

// RegisterPasskeyStart begins WebAuthn registration; the response includes
// the challenge to be signed by the authenticator.
func (c *Client) RegisterPasskeyStart(ctx context.Context, userID, tenantID string) (map[string]any, error) {
	body := map[string]any{"userId": userID, "tenantId": tenantID}
	return c.base.Do(ctx, http.MethodPost, "/passkeys/register/start", body, nil, "")
}

// RegisterPasskeyComplete finishes WebAuthn registration with the
// authenticator's signed response.
func (c *Client) RegisterPasskeyComplete(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/passkeys/register/complete", body, nil, "")
}

// AuthenticatePasskeyStart begins WebAuthn login.
func (c *Client) AuthenticatePasskeyStart(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/passkeys/authenticate/start", body, nil, "")
}

// AuthenticatePasskeyComplete finishes WebAuthn login.
func (c *Client) AuthenticatePasskeyComplete(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/passkeys/authenticate/complete", body, nil, "")
}

// ListPasskeys returns all registered passkeys for a user.
func (c *Client) ListPasskeys(ctx context.Context, userID, tenantID string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/passkeys", nil, map[string]string{"userId": userID, "tenantId": tenantID}, "")
}

// DeletePasskey revokes a registered passkey.
func (c *Client) DeletePasskey(ctx context.Context, credentialID string) error {
	_, err := c.base.Do(ctx, http.MethodDelete, "/passkeys/"+credentialID, nil, nil, "")
	return err
}

// ── MFA ──────────────────────────────────────────────────────────────

// MfaChallenge issues an MFA challenge.
func (c *Client) MfaChallenge(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/mfa/challenge", body, nil, "")
}

// MfaVerify validates an MFA challenge response.
func (c *Client) MfaVerify(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/mfa/verify", body, nil, "")
}

// ── Federated identity ──────────────────────────────────────────────

// FederateSAML processes a SAML assertion from an external IdP.
func (c *Client) FederateSAML(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/federate/saml", body, nil, "")
}

// FederateOIDC handles the OIDC callback from an external IdP.
func (c *Client) FederateOIDC(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/federate/oidc", body, nil, "")
}

// ── Risk-based auth ──────────────────────────────────────────────────

// EvaluateRisk computes a risk score for an authentication event.
func (c *Client) EvaluateRisk(ctx context.Context, body map[string]any) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/risk/evaluate", body, nil, "")
}

// ListRiskPolicies returns the configured risk policies for the tenant.
func (c *Client) ListRiskPolicies(ctx context.Context, tenantID string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/risk/policies", nil, map[string]string{"tenantId": tenantID}, "")
}

// Do exposes the underlying service client for endpoints not yet wrapped.
func (c *Client) Do(ctx context.Context, method, path string, body any, query map[string]string, idempotencyKey string) (map[string]any, error) {
	return c.base.Do(ctx, method, path, body, query, idempotencyKey)
}
