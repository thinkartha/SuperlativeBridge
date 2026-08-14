package main

import (
	"context"
	"embed"
	"fmt"
	"os"
	"sort"
	"strings"

	"github.com/aws/aws-lambda-go/lambda"
	"github.com/jackc/pgx/v5/pgxpool"
)

//go:embed migrations/*.sql
var migrationFS embed.FS

type event struct {
	Action string `json:"action"`
}

type result struct {
	Applied []string `json:"applied"`
	Message string   `json:"message"`
}

func handler(ctx context.Context, ev event) (result, error) {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		return result{}, fmt.Errorf("DATABASE_URL not set")
	}
	pool, err := pgxpool.New(ctx, dsn)
	if err != nil {
		return result{}, err
	}
	defer pool.Close()

	_, err = pool.Exec(ctx, `CREATE TABLE IF NOT EXISTS schema_migrations (
		filename TEXT PRIMARY KEY,
		applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
	)`)
	if err != nil {
		return result{}, err
	}

	entries, err := migrationFS.ReadDir("migrations")
	if err != nil {
		return result{}, err
	}
	var files []string
	for _, e := range entries {
		if !e.IsDir() && strings.HasSuffix(e.Name(), ".sql") {
			files = append(files, e.Name())
		}
	}
	sort.Strings(files)

	applied := []string{}
	for _, name := range files {
		var exists bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM schema_migrations WHERE filename=$1)`, name).Scan(&exists)
		if exists {
			continue
		}
		body, err := migrationFS.ReadFile("migrations/" + name)
		if err != nil {
			return result{}, err
		}
		tx, err := pool.Begin(ctx)
		if err != nil {
			return result{}, err
		}
		if _, err := tx.Exec(ctx, string(body)); err != nil {
			_ = tx.Rollback(ctx)
			return result{}, fmt.Errorf("%s: %w", name, err)
		}
		if _, err := tx.Exec(ctx, `INSERT INTO schema_migrations (filename) VALUES ($1)`, name); err != nil {
			_ = tx.Rollback(ctx)
			return result{}, err
		}
		if err := tx.Commit(ctx); err != nil {
			return result{}, err
		}
		applied = append(applied, name)
	}
	return result{Applied: applied, Message: fmt.Sprintf("applied %d migrations", len(applied))}, nil
}

func main() {
	lambda.Start(handler)
}
