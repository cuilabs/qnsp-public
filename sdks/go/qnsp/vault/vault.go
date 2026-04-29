// Package vault is the QNSP Vault client — PQC-encrypted secret storage
// with versioning, rotation, and deletion.
package vault

import (
	"context"
	"net/http"
	"strconv"
	"time"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/internal/qnspcore"
)

const pathPrefix = "/vault/v1"

// Client is the QNSP vault client.
type Client struct {
	base *qnspcore.ServiceClient
}

// New constructs a vault client that shares an Activator and HTTP client
// with the parent qnsp.Client.
func New(act *qnspcore.Activator, httpClient *http.Client, timeout time.Duration) *Client {
	return &Client{base: qnspcore.NewServiceClient(act, httpClient, pathPrefix, timeout)}
}

// CreateSecretRequest is the JSON body for POST /vault/v1/secrets.
type CreateSecretRequest struct {
	Name       string         `json:"name"`
	PayloadB64 string         `json:"payloadB64"`
	Algorithm  string         `json:"algorithm,omitempty"`
	Metadata   map[string]any `json:"metadata,omitempty"`
}

func (c *Client) CreateSecret(ctx context.Context, req CreateSecretRequest, idempotencyKey string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/secrets", req, nil, idempotencyKey)
}

func (c *Client) GetSecret(ctx context.Context, secretID string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/secrets/"+secretID, nil, nil, "")
}

func (c *Client) GetSecretVersion(ctx context.Context, secretID string, version int) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/secrets/"+secretID+"/versions/"+strconv.Itoa(version), nil, nil, "")
}

func (c *Client) RotateSecret(ctx context.Context, secretID string, payloadB64, algorithm string, idempotencyKey string) (map[string]any, error) {
	body := map[string]any{"payloadB64": payloadB64}
	if algorithm != "" {
		body["algorithm"] = algorithm
	}
	return c.base.Do(ctx, http.MethodPost, "/secrets/"+secretID+"/rotate", body, nil, idempotencyKey)
}

func (c *Client) DeleteSecret(ctx context.Context, secretID string) error {
	_, err := c.base.Do(ctx, http.MethodDelete, "/secrets/"+secretID, nil, nil, "")
	return err
}

func (c *Client) ListSecretVersions(ctx context.Context, secretID string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/secrets/"+secretID+"/versions", nil, nil, "")
}
