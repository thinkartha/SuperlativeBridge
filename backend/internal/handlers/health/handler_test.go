package health

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_GET_DegradedWithoutDatabase(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	t.Setenv("DATABASE_URL", "")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "GET",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 503 {
		t.Fatalf("status = %d, want 503", res.StatusCode)
	}

	var body struct {
		Status string `json:"status"`
		Checks map[string]struct {
			Status string `json:"status"`
		} `json:"checks"`
	}
	if err := json.Unmarshal([]byte(res.Body), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body.Status != "degraded" {
		t.Fatalf("status = %q, want degraded", body.Status)
	}
	if body.Checks["jwt"].Status != "ok" {
		t.Fatalf("jwt check = %+v", body.Checks["jwt"])
	}
	if body.Checks["postgres"].Status != "fail" {
		t.Fatalf("postgres check = %+v", body.Checks["postgres"])
	}
}

func TestHandler_MethodNotAllowed(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "POST",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 405 {
		t.Fatalf("status = %d, want 405", res.StatusCode)
	}
}
