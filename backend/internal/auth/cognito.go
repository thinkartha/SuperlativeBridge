package auth

import (
	"context"
	"crypto/rsa"
	"encoding/base64"
	"encoding/json"
	"errors"
	"math/big"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
)

// FromRequest extracts and validates the bearer token — Cognito JWT when
// COGNITO_USER_POOL_ID is set, otherwise local HS256 JWT_SECRET tokens.
// When Cognito is enabled, maps the caller to a Postgres users.id when linked.
func FromRequest(ctx context.Context, headers map[string]string) (*Claims, error) {
	var raw string
	for k, v := range headers {
		if strings.EqualFold(k, "Authorization") {
			raw = v
			break
		}
	}
	if raw == "" {
		return nil, errors.New("missing authorization header")
	}
	parts := strings.SplitN(raw, " ", 2)
	token := raw
	if len(parts) == 2 && strings.EqualFold(parts[0], "Bearer") {
		token = parts[1]
	}

	var claims *Claims
	var err error
	if os.Getenv("COGNITO_USER_POOL_ID") != "" {
		if claims, err = ParseCognitoToken(token); err == nil {
			return resolvePostgresUser(ctx, claims)
		}
	}
	claims, err = ParseToken(token)
	if err != nil {
		return nil, err
	}
	return claims, nil
}

func resolvePostgresUser(ctx context.Context, claims *Claims) (*Claims, error) {
	if ctx == nil || os.Getenv("COGNITO_USER_POOL_ID") == "" {
		return claims, nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return claims, nil
	}
	var pgID, pgRole string
	err = pool.QueryRow(ctx,
		`SELECT id, role FROM users WHERE cognito_sub = $1 OR ($2 <> '' AND lower(email) = lower($2))`,
		claims.UserID, claims.Email,
	).Scan(&pgID, &pgRole)
	if err == pgx.ErrNoRows {
		return claims, nil
	}
	if err != nil {
		return claims, nil
	}
	claims.UserID = pgID
	if pgRole != "" {
		claims.Role = pgRole
	}
	return claims, nil
}

type jwksCache struct {
	mu      sync.RWMutex
	keys    map[string]*rsa.PublicKey
	fetched time.Time
}

var cognitoJWKS = &jwksCache{keys: map[string]*rsa.PublicKey{}}

type jwkSet struct {
	Keys []jwk `json:"keys"`
}

type jwk struct {
	Kid string `json:"kid"`
	Kty string `json:"kty"`
	N   string `json:"n"`
	E   string `json:"e"`
	Alg string `json:"alg"`
}

func jwksURL() string {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = os.Getenv("COGNITO_REGION")
	}
	if region == "" {
		region = "us-east-1"
	}
	pool := os.Getenv("COGNITO_USER_POOL_ID")
	return "https://cognito-idp." + region + ".amazonaws.com/" + pool + "/.well-known/jwks.json"
}

func (c *jwksCache) get(kid string) (*rsa.PublicKey, error) {
	c.mu.RLock()
	if key, ok := c.keys[kid]; ok && time.Since(c.fetched) < time.Hour {
		c.mu.RUnlock()
		return key, nil
	}
	c.mu.RUnlock()

	c.mu.Lock()
	defer c.mu.Unlock()
	resp, err := http.Get(jwksURL())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()
	var set jwkSet
	if err := json.NewDecoder(resp.Body).Decode(&set); err != nil {
		return nil, err
	}
	c.keys = map[string]*rsa.PublicKey{}
	for _, k := range set.Keys {
		pub, err := jwkToRSA(k)
		if err != nil {
			continue
		}
		c.keys[k.Kid] = pub
	}
	c.fetched = time.Now()
	key, ok := c.keys[kid]
	if !ok {
		return nil, errors.New("kid not found in JWKS")
	}
	return key, nil
}

func jwkToRSA(k jwk) (*rsa.PublicKey, error) {
	nb, err := base64.RawURLEncoding.DecodeString(k.N)
	if err != nil {
		return nil, err
	}
	eb, err := base64.RawURLEncoding.DecodeString(k.E)
	if err != nil {
		return nil, err
	}
	e := 0
	for _, b := range eb {
		e = e<<8 + int(b)
	}
	return &rsa.PublicKey{N: new(big.Int).SetBytes(nb), E: e}, nil
}

type cognitoClaims struct {
	Sub           string   `json:"sub"`
	Email         string   `json:"email"`
	TokenUse      string   `json:"token_use"`
	CognitoGroups []string `json:"cognito:groups"`
	CustomRole    string   `json:"custom:role"`
	Username      string   `json:"cognito:username"`
	jwt.RegisteredClaims
}

// ParseCognitoToken validates an RS256 Cognito access/id token and maps role.
func ParseCognitoToken(tokenStr string) (*Claims, error) {
	parser := jwt.NewParser(jwt.WithValidMethods([]string{"RS256"}))
	tok, err := parser.ParseWithClaims(tokenStr, &cognitoClaims{}, func(t *jwt.Token) (interface{}, error) {
		kid, _ := t.Header["kid"].(string)
		return cognitoJWKS.get(kid)
	})
	if err != nil || !tok.Valid {
		return nil, errors.New("invalid cognito token")
	}
	cc, ok := tok.Claims.(*cognitoClaims)
	if !ok {
		return nil, errors.New("invalid cognito claims")
	}
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "us-east-1"
	}
	pool := os.Getenv("COGNITO_USER_POOL_ID")
	issuer := "https://cognito-idp." + region + ".amazonaws.com/" + pool
	if cc.Issuer != issuer {
		return nil, errors.New("invalid issuer")
	}
	role := cc.CustomRole
	if role == "" {
		role = roleFromGroups(cc.CognitoGroups)
	}
	if role == "" {
		role = "worker"
	}
	email := cc.Email
	if email == "" {
		email = cc.Username
	}
	return &Claims{
		UserID:           cc.Sub,
		Email:            email,
		Role:             role,
		RegisteredClaims: cc.RegisteredClaims,
	}, nil
}

func roleFromGroups(groups []string) string {
	for _, g := range groups {
		switch strings.ToLower(g) {
		case "admin", "worker", "employer", "mentor":
			return strings.ToLower(g)
		}
	}
	return ""
}
