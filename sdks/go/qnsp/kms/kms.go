// Package kms is the QNSP KMS client — server-side PQC keys with sign,
// verify, wrap, and unwrap.
package kms

import (
	"context"
	"encoding/base64"
	"fmt"
	"net/http"
	"time"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/internal/qnspcore"
)

const pathPrefix = "/kms/v1"

type Client struct {
	base *qnspcore.ServiceClient
}

func New(act *qnspcore.Activator, httpClient *http.Client, timeout time.Duration) *Client {
	return &Client{base: qnspcore.NewServiceClient(act, httpClient, pathPrefix, timeout)}
}

type CreateKeyRequest struct {
	Algorithm string         `json:"algorithm"`
	Purpose   string         `json:"purpose"` // "signing", "encryption", "kem"
	Metadata  map[string]any `json:"metadata,omitempty"`
}

func (c *Client) CreateKey(ctx context.Context, req CreateKeyRequest, idempotencyKey string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/keys", req, nil, idempotencyKey)
}

func (c *Client) ListKeys(ctx context.Context, query map[string]string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/keys", nil, query, "")
}

func (c *Client) GetKey(ctx context.Context, keyID string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodGet, "/keys/"+keyID, nil, nil, "")
}

func (c *Client) RotateKey(ctx context.Context, keyID string, idempotencyKey string) (map[string]any, error) {
	return c.base.Do(ctx, http.MethodPost, "/keys/"+keyID+"/rotate", nil, nil, idempotencyKey)
}

func (c *Client) DeleteKey(ctx context.Context, keyID string) error {
	_, err := c.base.Do(ctx, http.MethodDelete, "/keys/"+keyID, nil, nil, "")
	return err
}

func (c *Client) Sign(ctx context.Context, keyID string, data []byte, idempotencyKey string) ([]byte, error) {
	body := map[string]any{"dataB64": base64.StdEncoding.EncodeToString(data)}
	resp, err := c.base.Do(ctx, http.MethodPost, "/keys/"+keyID+"/sign", body, nil, idempotencyKey)
	if err != nil {
		return nil, err
	}
	sigB64, ok := resp["signatureB64"].(string)
	if !ok || sigB64 == "" {
		return nil, fmt.Errorf("qnsp: kms.Sign: missing signatureB64 in response")
	}
	return base64.StdEncoding.DecodeString(sigB64)
}

func (c *Client) Verify(ctx context.Context, keyID string, data, signature []byte) (bool, error) {
	body := map[string]any{
		"dataB64":      base64.StdEncoding.EncodeToString(data),
		"signatureB64": base64.StdEncoding.EncodeToString(signature),
	}
	resp, err := c.base.Do(ctx, http.MethodPost, "/keys/"+keyID+"/verify", body, nil, "")
	if err != nil {
		return false, err
	}
	valid, _ := resp["valid"].(bool)
	return valid, nil
}

func (c *Client) Wrap(ctx context.Context, keyID string, plaintext []byte, idempotencyKey string) ([]byte, error) {
	body := map[string]any{"plaintextB64": base64.StdEncoding.EncodeToString(plaintext)}
	resp, err := c.base.Do(ctx, http.MethodPost, "/keys/"+keyID+"/wrap", body, nil, idempotencyKey)
	if err != nil {
		return nil, err
	}
	ctB64, ok := resp["ciphertextB64"].(string)
	if !ok || ctB64 == "" {
		return nil, fmt.Errorf("qnsp: kms.Wrap: missing ciphertextB64 in response")
	}
	return base64.StdEncoding.DecodeString(ctB64)
}

func (c *Client) Unwrap(ctx context.Context, keyID string, ciphertext []byte, idempotencyKey string) ([]byte, error) {
	body := map[string]any{"ciphertextB64": base64.StdEncoding.EncodeToString(ciphertext)}
	resp, err := c.base.Do(ctx, http.MethodPost, "/keys/"+keyID+"/unwrap", body, nil, idempotencyKey)
	if err != nil {
		return nil, err
	}
	ptB64, ok := resp["plaintextB64"].(string)
	if !ok || ptB64 == "" {
		return nil, fmt.Errorf("qnsp: kms.Unwrap: missing plaintextB64 in response")
	}
	return base64.StdEncoding.DecodeString(ptB64)
}
