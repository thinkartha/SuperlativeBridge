package auth

import (
	"strings"
	"testing"
)

func TestHashPasswordAndCheckPassword(t *testing.T) {
	hash, err := HashPassword("password123")
	if err != nil {
		t.Fatalf("HashPassword: %v", err)
	}
	if hash == "" || hash == "password123" {
		t.Fatalf("expected bcrypt hash, got %q", hash)
	}
	if !CheckPassword(hash, "password123") {
		t.Fatal("CheckPassword should accept valid password")
	}
	if CheckPassword(hash, "wrong-password") {
		t.Fatal("CheckPassword should reject invalid password")
	}
}

func TestGenerateAndParseToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	t.Setenv("COGNITO_USER_POOL_ID", "")

	token, err := GenerateToken("user-123", "worker")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}
	if token == "" {
		t.Fatal("expected non-empty token")
	}

	claims, err := ParseToken(token)
	if err != nil {
		t.Fatalf("ParseToken: %v", err)
	}
	if claims.UserID != "user-123" || claims.Role != "worker" {
		t.Fatalf("claims mismatch: %+v", claims)
	}
}

func TestGenerateTokenRequiresSecret(t *testing.T) {
	t.Setenv("JWT_SECRET", "")
	_, err := GenerateToken("user-123", "worker")
	if err == nil {
		t.Fatal("expected error when JWT_SECRET is missing")
	}
}

func TestParseTokenRejectsInvalidToken(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	_, err := ParseToken("not-a-valid-token")
	if err == nil {
		t.Fatal("expected error for invalid token")
	}
}

func TestFromRequest(t *testing.T) {
	t.Setenv("JWT_SECRET", "unit-test-secret")
	t.Setenv("COGNITO_USER_POOL_ID", "")

	token, err := GenerateToken("user-abc", "admin")
	if err != nil {
		t.Fatalf("GenerateToken: %v", err)
	}

	claims, err := FromRequest(map[string]string{
		"Authorization": "Bearer " + token,
	})
	if err != nil {
		t.Fatalf("FromRequest: %v", err)
	}
	if claims.UserID != "user-abc" || claims.Role != "admin" {
		t.Fatalf("claims mismatch: %+v", claims)
	}

	_, err = FromRequest(map[string]string{})
	if err == nil || !strings.Contains(err.Error(), "missing authorization") {
		t.Fatalf("expected missing authorization error, got %v", err)
	}
}

func TestRoleFromGroups(t *testing.T) {
	tests := []struct {
		groups []string
		want   string
	}{
		{[]string{"admin"}, "admin"},
		{[]string{"Employers", "worker"}, "worker"},
		{[]string{"unknown-group"}, ""},
		{nil, ""},
	}
	for _, tc := range tests {
		if got := roleFromGroups(tc.groups); got != tc.want {
			t.Fatalf("roleFromGroups(%v) = %q, want %q", tc.groups, got, tc.want)
		}
	}
}
