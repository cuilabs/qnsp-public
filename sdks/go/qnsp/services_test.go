package qnsp_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/audit"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/kms"
	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/vault"
)

// fakeBackend stands in for QNSP edge-gateway: it answers
// /billing/v1/sdk/activate with a static activation, and routes /vault,
// /kms, /audit calls to per-test handlers.
type fakeBackend struct {
	t              *testing.T
	activationHits int
	rejectAuth     bool

	vault http.HandlerFunc
	kms   http.HandlerFunc
	audit http.HandlerFunc
}

func (f *fakeBackend) handler() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("/billing/v1/sdk/activate", func(w http.ResponseWriter, r *http.Request) {
		f.activationHits++
		if f.rejectAuth {
			w.WriteHeader(401)
			_ = json.NewEncoder(w).Encode(map[string]any{"code": "INVALID_API_KEY", "message": "no"})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{
			"tenantId":        "tenant-test",
			"tier":            "free",
			"limits":          map[string]any{"sseEnabled": true},
			"activationToken": "tkn",
			"expiresAt":       time.Now().Add(time.Hour).UTC().Format(time.RFC3339),
		})
	})
	mux.HandleFunc("/vault/", func(w http.ResponseWriter, r *http.Request) {
		if f.vault != nil {
			f.vault(w, r)
			return
		}
		w.WriteHeader(404)
	})
	mux.HandleFunc("/kms/", func(w http.ResponseWriter, r *http.Request) {
		if f.kms != nil {
			f.kms(w, r)
			return
		}
		w.WriteHeader(404)
	})
	mux.HandleFunc("/audit/", func(w http.ResponseWriter, r *http.Request) {
		if f.audit != nil {
			f.audit(w, r)
			return
		}
		w.WriteHeader(404)
	})
	return mux
}

func newClient(t *testing.T, b *fakeBackend) (*qnsp.Client, *httptest.Server) {
	t.Helper()
	srv := httptest.NewServer(b.handler())
	c, err := qnsp.NewClient(qnsp.ClientOptions{APIKey: "qnsp_pqc_test", BaseURL: srv.URL, Timeout: 5 * time.Second, HTTPClient: srv.Client()})
	if err != nil {
		t.Fatalf("NewClient: %v", err)
	}
	return c, srv
}

func TestVault_CreateGet(t *testing.T) {
	created := 0
	got := 0
	b := &fakeBackend{t: t}
	b.vault = func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/vault/v1/secrets":
			created++
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "sec-1", "name": "openai-api-key", "version": 1})
		case r.Method == http.MethodGet && strings.HasPrefix(r.URL.Path, "/vault/v1/secrets/"):
			got++
			_ = json.NewEncoder(w).Encode(map[string]any{"id": "sec-1", "version": 1})
		default:
			t.Errorf("unexpected vault call: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(500)
		}
	}
	c, srv := newClient(t, b)
	defer srv.Close()
	defer c.Close()

	ctx := context.Background()
	resp, err := c.Vault().CreateSecret(ctx, vault.CreateSecretRequest{
		Name:       "openai-api-key",
		PayloadB64: "cGF5bG9hZA==",
		Algorithm:  "ml-kem-768",
	}, "")
	if err != nil {
		t.Fatalf("CreateSecret: %v", err)
	}
	if resp["id"] != "sec-1" {
		t.Fatalf("unexpected create resp: %+v", resp)
	}
	if _, err := c.Vault().GetSecret(ctx, "sec-1"); err != nil {
		t.Fatalf("GetSecret: %v", err)
	}
	if created != 1 || got != 1 {
		t.Fatalf("expected 1 create + 1 get, got %d/%d", created, got)
	}
}

func TestKMS_CreateSignVerify(t *testing.T) {
	b := &fakeBackend{t: t}
	b.kms = func(w http.ResponseWriter, r *http.Request) {
		switch {
		case r.Method == http.MethodPost && r.URL.Path == "/kms/v1/keys":
			_ = json.NewEncoder(w).Encode(map[string]any{"keyId": "key-1", "algorithm": "ml-dsa-65"})
		case r.Method == http.MethodPost && r.URL.Path == "/kms/v1/keys/key-1/sign":
			_ = json.NewEncoder(w).Encode(map[string]any{"signatureB64": "c2lnbmF0dXJl"})
		case r.Method == http.MethodPost && r.URL.Path == "/kms/v1/keys/key-1/verify":
			_ = json.NewEncoder(w).Encode(map[string]any{"valid": true})
		default:
			t.Errorf("unexpected kms call: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(500)
		}
	}
	c, srv := newClient(t, b)
	defer srv.Close()
	defer c.Close()

	ctx := context.Background()
	if _, err := c.KMS().CreateKey(ctx, kms.CreateKeyRequest{Algorithm: "ml-dsa-65", Purpose: "signing"}, ""); err != nil {
		t.Fatalf("CreateKey: %v", err)
	}
	sig, err := c.KMS().Sign(ctx, "key-1", []byte("hello"), "")
	if err != nil {
		t.Fatalf("Sign: %v", err)
	}
	if string(sig) != "signature" {
		t.Fatalf("expected 'signature', got %q", string(sig))
	}
	ok, err := c.KMS().Verify(ctx, "key-1", []byte("hello"), sig)
	if err != nil {
		t.Fatalf("Verify: %v", err)
	}
	if !ok {
		t.Fatal("expected verify ok=true")
	}
}

func TestAudit_LogEvent(t *testing.T) {
	b := &fakeBackend{t: t}
	b.audit = func(w http.ResponseWriter, r *http.Request) {
		if r.Method != http.MethodPost || r.URL.Path != "/audit/v1/events" {
			t.Errorf("unexpected audit call: %s %s", r.Method, r.URL.Path)
			w.WriteHeader(500)
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"id": "evt-1"})
	}
	c, srv := newClient(t, b)
	defer srv.Close()
	defer c.Close()

	resp, err := c.Audit().LogEvent(context.Background(), audit.LogEventRequest{
		EventType: "model.inference",
		Payload:   map[string]any{"latencyMs": 100},
	}, "")
	if err != nil {
		t.Fatalf("LogEvent: %v", err)
	}
	if resp["id"] != "evt-1" {
		t.Fatalf("unexpected resp: %+v", resp)
	}
}

func TestServiceClient_401TriggersRefresh(t *testing.T) {
	calls := 0
	b := &fakeBackend{t: t}
	b.vault = func(w http.ResponseWriter, r *http.Request) {
		calls++
		if calls == 1 {
			w.WriteHeader(401)
			_ = json.NewEncoder(w).Encode(map[string]any{"code": "TOKEN_EXPIRED", "message": "rotate"})
			return
		}
		_ = json.NewEncoder(w).Encode(map[string]any{"id": "sec-1"})
	}
	c, srv := newClient(t, b)
	defer srv.Close()
	defer c.Close()

	if _, err := c.Vault().GetSecret(context.Background(), "sec-1"); err != nil {
		t.Fatalf("GetSecret: %v", err)
	}
	if calls != 2 {
		t.Fatalf("expected 2 vault calls (401 + retry), got %d", calls)
	}
	if b.activationHits < 2 {
		t.Fatalf("expected >=2 activation hits, got %d", b.activationHits)
	}
}
