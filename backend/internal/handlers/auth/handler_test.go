package auth

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/aws/aws-lambda-go/events"
)

func TestHandler_CognitoConfig_LocalMode(t *testing.T) {
	t.Setenv("COGNITO_USER_POOL_ID", "")
	t.Setenv("COGNITO_CLIENT_ID", "")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource: "/api/auth/cognito-config",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 200 {
		t.Fatalf("status = %d, want 200", res.StatusCode)
	}

	var body map[string]interface{}
	if err := json.Unmarshal([]byte(res.Body), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body["enabled"] != false || body["authMode"] != "local" {
		t.Fatalf("body = %v", body)
	}
}

func TestHandler_CognitoConfig_Enabled(t *testing.T) {
	t.Setenv("COGNITO_USER_POOL_ID", "us-east-1_pool")
	t.Setenv("COGNITO_CLIENT_ID", "client-id")
	t.Setenv("AWS_REGION", "us-east-1")
	t.Setenv("COGNITO_DOMAIN", "auth.example.com")

	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource: "/api/auth/cognito-config",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}

	var body map[string]interface{}
	if err := json.Unmarshal([]byte(res.Body), &body); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if body["enabled"] != true || body["authMode"] != "cognito" {
		t.Fatalf("body = %v", body)
	}
}

func TestHandler_Signin_InvalidBody(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource:   "/api/auth/signin",
		HTTPMethod: "POST",
		Body:       "not-json",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 400 {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestHandler_Signup_MissingFields(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource:   "/api/auth/signup",
		HTTPMethod: "POST",
		Body:       `{"email":"user@example.com"}`,
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 400 {
		t.Fatalf("status = %d, want 400", res.StatusCode)
	}
}

func TestHandler_NotFound(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource: "/api/auth/unknown",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 404 {
		t.Fatalf("status = %d, want 404", res.StatusCode)
	}
}

func TestHandler_Me_Unauthorized(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource:   "/api/auth/me",
		HTTPMethod: "GET",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestHandler_Provision_RequiresCognitoToken(t *testing.T) {
	t.Setenv("COGNITO_USER_POOL_ID", "us-east-1_pool")
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource:   "/api/auth/provision",
		HTTPMethod: "POST",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 401 {
		t.Fatalf("status = %d, want 401", res.StatusCode)
	}
}

func TestHandler_Me_MethodNotAllowed(t *testing.T) {
	res, err := Handler(context.Background(), events.APIGatewayProxyRequest{
		Resource:   "/api/auth/me",
		HTTPMethod: "POST",
	})
	if err != nil {
		t.Fatalf("Handler: %v", err)
	}
	if res.StatusCode != 405 {
		t.Fatalf("status = %d, want 405", res.StatusCode)
	}
}
