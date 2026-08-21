package courses

import (
	"context"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_MethodNotAllowed(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		HTTPMethod: "PATCH",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 405 {
		t.Fatalf("status = %d, want 405", res.StatusCode)
	}
}
