package middleware

import (
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"crypto/subtle"
	"encoding/hex"
	"net/http"
	"os"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/response"
)

// SecurityHeaders returns standard API security headers.
func SecurityHeaders() map[string]string {
	return map[string]string{
		"Access-Control-Allow-Origin":  "*",
		"Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,X-SB-Signature,X-SB-Timestamp,X-Request-Id",
		"Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
		"X-Content-Type-Options":       "nosniff",
		"X-Frame-Options":              "DENY",
		"Referrer-Policy":              "no-referrer",
		"Cache-Control":                "no-store",
	}
}

// RequireUser validates Cognito or local JWT and returns claims.
func RequireUser(ctx context.Context, headers map[string]string) (*auth.Claims, events.APIGatewayProxyResponse, bool) {
	claims, err := auth.FromRequest(ctx, headers)
	if err != nil {
		return nil, response.Error(401, "unauthorized"), false
	}
	return claims, events.APIGatewayProxyResponse{}, true
}

// RequireAdmin ensures the caller is an admin.
func RequireAdmin(ctx context.Context, headers map[string]string) (*auth.Claims, events.APIGatewayProxyResponse, bool) {
	claims, res, ok := RequireUser(ctx, headers)
	if !ok {
		return nil, res, false
	}
	if claims.Role != "admin" {
		return nil, response.Error(403, "admin role required"), false
	}
	return claims, events.APIGatewayProxyResponse{}, true
}

// RequireIntegrationAPIKey validates X-Api-Key for LMS / partner ingest.
func RequireIntegrationAPIKey(headers map[string]string) (events.APIGatewayProxyResponse, bool) {
	expected := os.Getenv("LMS_API_KEY")
	if expected == "" {
		expected = os.Getenv("INTEGRATION_API_KEY")
	}
	if expected == "" {
		return response.Error(503, "integration API key not configured"), false
	}
	got := header(headers, "X-Api-Key")
	if got == "" || subtle.ConstantTimeCompare([]byte(got), []byte(expected)) != 1 {
		return response.Error(401, "invalid API key"), false
	}
	return events.APIGatewayProxyResponse{}, true
}

// VerifyWebhookSignature checks HMAC-SHA256 of body using INTEGRATION_WEBHOOK_SECRET.
// Header: X-SB-Signature = hex(hmac_sha256(timestamp + "." + body))
// Header: X-SB-Timestamp = unix seconds (must be within 5 minutes).
func VerifyWebhookSignature(headers map[string]string, body string) (events.APIGatewayProxyResponse, bool) {
	secret := os.Getenv("INTEGRATION_WEBHOOK_SECRET")
	if secret == "" {
		return response.Error(503, "webhook secret not configured"), false
	}
	ts := header(headers, "X-SB-Timestamp")
	sig := header(headers, "X-SB-Signature")
	if ts == "" || sig == "" {
		return response.Error(401, "missing signature headers"), false
	}
	sec, err := strconv.ParseInt(ts, 10, 64)
	if err != nil {
		return response.Error(401, "invalid timestamp"), false
	}
	now := time.Now().Unix()
	if abs(now-sec) > 300 {
		return response.Error(401, "timestamp outside allowed window"), false
	}
	mac := hmac.New(sha256.New, []byte(secret))
	mac.Write([]byte(ts + "." + body))
	expected := hex.EncodeToString(mac.Sum(nil))
	if !hmac.Equal([]byte(strings.ToLower(sig)), []byte(strings.ToLower(expected))) {
		return response.Error(401, "invalid signature"), false
	}
	return events.APIGatewayProxyResponse{}, true
}

func header(headers map[string]string, name string) string {
	for k, v := range headers {
		if strings.EqualFold(k, name) {
			return v
		}
	}
	return ""
}

func abs(n int64) int64 {
	if n < 0 {
		return -n
	}
	return n
}

// ─── Simple in-memory rate limiter (per warm Lambda instance) ──────────────

type rateLimiter struct {
	mu     sync.Mutex
	hits   map[string][]time.Time
	limit  int
	window time.Duration
}

var defaultLimiter = &rateLimiter{
	hits:   map[string][]time.Time{},
	limit:  60,
	window: time.Minute,
}

// AllowRate returns false when the key exceeded the per-minute budget.
func AllowRate(key string) bool {
	return defaultLimiter.allow(key)
}

func (r *rateLimiter) allow(key string) bool {
	r.mu.Lock()
	defer r.mu.Unlock()
	now := time.Now()
	cutoff := now.Add(-r.window)
	arr := r.hits[key]
	kept := arr[:0]
	for _, t := range arr {
		if t.After(cutoff) {
			kept = append(kept, t)
		}
	}
	if len(kept) >= r.limit {
		r.hits[key] = kept
		return false
	}
	r.hits[key] = append(kept, now)
	return true
}

// HTTPStatus is a helper for localserver middleware adapters.
func HTTPStatus(code int) int {
	if code == 0 {
		return http.StatusOK
	}
	return code
}
