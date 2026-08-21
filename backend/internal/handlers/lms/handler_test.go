package lms

import (
	"context"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_NotFound(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
		Resource:   "/api/lms/unknown",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}

func TestHandler_ImportRequiresAPIKey(t *testing.T) {
	t.Setenv("LMS_API_KEY", "partner-key")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Resource:   "/api/lms/courses/import",
		Body:       `{}`,
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestHandler_ImportAcceptsAPIKey(t *testing.T) {
	t.Setenv("LMS_API_KEY", "partner-key")
	t.Setenv("DATABASE_URL", "")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Resource:   "/api/lms/courses/import",
		Headers:    map[string]string{"X-Api-Key": "partner-key"},
		Body:       `{}`,
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	// Auth passes; handler continues to DB/body validation and returns 400/500 without Postgres.
	if res.StatusCode == 401 {
		t.Fatalf("valid API key should not return 401, got %d body=%s", res.StatusCode, res.Body)
	}
}

func TestHandler_WebhookRequiresSignature(t *testing.T) {
	t.Setenv("INTEGRATION_WEBHOOK_SECRET", "webhook-secret")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
		Resource:   "/api/lms/webhooks/moodle",
		Body:       `{}`,
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}
