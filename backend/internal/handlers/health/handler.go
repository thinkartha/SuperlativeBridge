package health

import (
	"context"
	"os"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/response"
)

type check struct {
	Status  string `json:"status"`
	Detail  string `json:"detail,omitempty"`
	Latency string `json:"latencyMs,omitempty"`
}

type health struct {
	Status    string           `json:"status"`
	Timestamp string           `json:"timestamp"`
	Checks    map[string]check `json:"checks"`
}

func checkPostgres(ctx context.Context) check {
	if os.Getenv("DATABASE_URL") == "" {
		return check{Status: "fail", Detail: "DATABASE_URL not set"}
	}
	start := time.Now()
	pool, err := db.Pool(ctx)
	if err != nil {
		return check{Status: "fail", Detail: err.Error()}
	}
	pingCtx, cancel := context.WithTimeout(ctx, 5*time.Second)
	defer cancel()

	var one int
	if err := pool.QueryRow(pingCtx, "SELECT 1").Scan(&one); err != nil {
		return check{Status: "fail", Detail: err.Error()}
	}

	var tables int
	if err := pool.QueryRow(pingCtx,
		`SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public'`).Scan(&tables); err != nil {
		return check{Status: "fail", Detail: err.Error()}
	}
	if tables == 0 {
		return check{Status: "fail", Detail: "no tables found in public schema - migrations not applied"}
	}

	return check{
		Status:  "ok",
		Detail:  "connected; public tables present",
		Latency: time.Since(start).Truncate(time.Millisecond).String(),
	}
}

func checkJWT() check {
	if os.Getenv("JWT_SECRET") == "" {
		return check{Status: "fail", Detail: "JWT_SECRET not set"}
	}
	token, err := auth.GenerateToken("health-check", "admin")
	if err != nil {
		return check{Status: "fail", Detail: err.Error()}
	}
	claims, err := auth.ParseToken(token)
	if err != nil {
		return check{Status: "fail", Detail: err.Error()}
	}
	if claims.UserID != "health-check" || claims.Role != "admin" {
		return check{Status: "fail", Detail: "claims roundtrip mismatch"}
	}
	return check{Status: "ok", Detail: "sign/verify roundtrip succeeded"}
}

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if req.HTTPMethod != "GET" {
		return response.Error(405, "method not allowed"), nil
	}

	checks := map[string]check{
		"postgres": checkPostgres(ctx),
		"jwt":      checkJWT(),
	}

	status := "ok"
	code := 200
	for _, c := range checks {
		if c.Status != "ok" {
			status = "degraded"
			code = 503
		}
	}

	return response.JSON(code, health{
		Status:    status,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
		Checks:    checks,
	}), nil
}
