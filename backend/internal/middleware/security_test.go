package middleware

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"strconv"
	"testing"
	"time"

	authpkg "github.com/superlativebridge/backend/internal/auth"
)

func TestRequireUserAndRequireAdmin(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	t.Setenv("COGNITO_USER_POOL_ID", "")

	adminToken, err := authpkg.GenerateToken("admin-1", "admin")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}
	workerToken, err := authpkg.GenerateToken("worker-1", "worker")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	_, res, ok := RequireUser(map[string]string{})
	if ok || res.StatusCode != 401 {
		t.Fatalf("RequireUser without header: ok=%v status=%d", ok, res.StatusCode)
	}

	claims, res, ok := RequireUser(map[string]string{"Authorization": "Bearer " + adminToken})
	if !ok || res.StatusCode != 0 || claims.Role != "admin" {
		t.Fatalf("RequireUser admin: ok=%v status=%d role=%q", ok, res.StatusCode, claims.Role)
	}

	_, res, ok = RequireAdmin(map[string]string{"Authorization": "Bearer " + workerToken})
	if ok || res.StatusCode != 403 {
		t.Fatalf("RequireAdmin worker: ok=%v status=%d", ok, res.StatusCode)
	}

	claims, res, ok = RequireAdmin(map[string]string{"Authorization": "Bearer " + adminToken})
	if !ok || res.StatusCode != 0 || claims.Role != "admin" {
		t.Fatalf("RequireAdmin admin: ok=%v status=%d", ok, res.StatusCode)
	}
}

func TestRequireIntegrationAPIKey(t *testing.T) {
	t.Setenv("LMS_API_KEY", "partner-key")
	t.Setenv("INTEGRATION_API_KEY", "")

	_, ok := RequireIntegrationAPIKey(map[string]string{"X-Api-Key": "partner-key"})
	if !ok {
		t.Fatal("expected valid API key to pass")
	}

	res, ok := RequireIntegrationAPIKey(map[string]string{"X-Api-Key": "wrong-key"})
	if ok || res.StatusCode != 401 {
		t.Fatalf("invalid key: ok=%v status=%d", ok, res.StatusCode)
	}

	t.Setenv("LMS_API_KEY", "")
	res, ok = RequireIntegrationAPIKey(map[string]string{"X-Api-Key": "anything"})
	if ok || res.StatusCode != 503 {
		t.Fatalf("missing configured key: ok=%v status=%d", ok, res.StatusCode)
	}
}

func TestVerifyWebhookSignature(t *testing.T) {
	secret := "webhook-secret"
	body := `{"event":"course.completed"}`
	ts := strconv.FormatInt(time.Now().Unix(), 10)

	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(ts + "." + body))
	sig := hex.EncodeToString(mac.Sum(nil))

	t.Setenv("INTEGRATION_WEBHOOK_SECRET", secret)
	_, ok := VerifyWebhookSignature(map[string]string{
		"X-SB-Timestamp":  ts,
		"X-SB-Signature": sig,
	}, body)
	if !ok {
		t.Fatal("expected valid webhook signature to pass")
	}

	res, ok := VerifyWebhookSignature(map[string]string{
		"X-SB-Timestamp":  ts,
		"X-SB-Signature": "deadbeef",
	}, body)
	if ok || res.StatusCode != 401 {
		t.Fatalf("invalid signature: ok=%v status=%d", ok, res.StatusCode)
	}

	res, ok = VerifyWebhookSignature(map[string]string{}, body)
	if ok || res.StatusCode != 401 {
		t.Fatalf("missing headers: ok=%v status=%d", ok, res.StatusCode)
	}
}

func TestAllowRate(t *testing.T) {
	key := "rate-test-" + strconv.FormatInt(time.Now().UnixNano(), 10)
	for i := 0; i < 60; i++ {
		if !AllowRate(key) {
			t.Fatalf("request %d should be allowed", i+1)
		}
	}
	if AllowRate(key) {
		t.Fatal("61st request in one minute should be blocked")
	}
}

func TestSecurityHeaders(t *testing.T) {
	h := SecurityHeaders()
	if h["Access-Control-Allow-Origin"] != "*" {
		t.Fatalf("unexpected CORS header: %v", h["Access-Control-Allow-Origin"])
	}
	if h["X-Frame-Options"] != "DENY" {
		t.Fatalf("unexpected frame options: %v", h["X-Frame-Options"])
	}
}
