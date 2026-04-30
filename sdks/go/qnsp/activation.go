package qnsp

import (
	"context"
	"net/http"
	"time"

	"github.com/cuilabs/qnsp-public/sdks/go/qnsp/internal/qnspcore"
)

// SDK identity reported in the activation handshake.
const (
	sdkID      = "qnsp-go"
	sdkVersion = "0.2.0"
)

func init() {
	qnspcore.SetSDKIdentity(sdkID, sdkVersion)
}

// ActivationResult is the decoded response from the SDK activation
// handshake against billing-service.
type ActivationResult = qnspcore.ActivationResult

// Activator performs the SDK activation handshake and caches the result.
type Activator = qnspcore.Activator

// NewActivator constructs an Activator. Equivalent to
// qnspcore.NewActivator; preserved here so external code can refer to
// it via the public package.
func NewActivator(apiKey, baseURL string, timeout time.Duration, httpClient *http.Client) (*Activator, error) {
	return qnspcore.NewActivator(apiKey, baseURL, timeout, httpClient)
}

// EnsureActivated forces the activation handshake to run now. Equivalent
// to calling activator.Get(ctx) directly.
func EnsureActivated(ctx context.Context, a *Activator) (*ActivationResult, error) {
	return a.Get(ctx)
}
