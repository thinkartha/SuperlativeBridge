package auth

import (
	"context"
	"encoding/json"
	"os"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	authpkg "github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.Resource {
	case "/api/auth/signin":
		return signin(ctx, req)
	case "/api/auth/signup":
		return signup(ctx, req)
	case "/api/auth/cognito-config":
		return cognitoConfig()
	default:
		return response.Error(404, "not found"), nil
	}
}

func cognitoConfig() (events.APIGatewayProxyResponse, error) {
	pool := os.Getenv("COGNITO_USER_POOL_ID")
	client := os.Getenv("COGNITO_CLIENT_ID")
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}
	enabled := pool != "" && client != ""
	out := map[string]interface{}{
		"enabled":    enabled,
		"userPoolId": pool,
		"clientId":   client,
		"region":     region,
		"authMode":   "local",
	}
	if enabled {
		out["authMode"] = "cognito"
		out["hostedUiDomain"] = os.Getenv("COGNITO_DOMAIN")
	}
	return response.JSON(200, out), nil
}

func signin(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var u models.AuthUser
	var passwordHash string
	err = pool.QueryRow(ctx, `SELECT id, name, email, role, vertical, password_hash FROM users WHERE email = $1`, body.Email).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Vertical, &passwordHash)
	if err == pgx.ErrNoRows {
		return response.Error(401, "invalid email or password"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if !authpkg.CheckPassword(passwordHash, body.Password) {
		return response.Error(401, "invalid email or password"), nil
	}

	token, err := authpkg.GenerateToken(u.ID, u.Role)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, map[string]interface{}{"user": u, "token": token}), nil
}

func signup(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body struct {
		Name     string `json:"name"`
		Email    string `json:"email"`
		Password string `json:"password"`
		Role     string `json:"role"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	if body.Name == "" || body.Email == "" || body.Password == "" {
		return response.Error(400, "name, email and password required"), nil
	}
	if body.Role == "" {
		body.Role = "worker"
	}

	hash, err := authpkg.HashPassword(body.Password)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var u models.AuthUser
	u.Name = body.Name
	u.Email = body.Email
	u.Role = body.Role
	err = pool.QueryRow(ctx, `INSERT INTO users (name, email, password_hash, role) VALUES ($1,$2,$3,$4) RETURNING id`,
		body.Name, body.Email, hash, body.Role).Scan(&u.ID)
	if err != nil {
		return response.Error(409, "email already registered"), nil
	}

	token, err := authpkg.GenerateToken(u.ID, u.Role)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, map[string]interface{}{"user": u, "token": token}), nil
}
