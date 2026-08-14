package db

import (
	"context"
	"os"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"
)

var (
	pool     *pgxpool.Pool
	initOnce sync.Once
	initErr  error
)

// Queryer is satisfied by *pgxpool.Pool (and pgx.Tx) so helper functions can
// accept either a pool or a transaction.
type Queryer interface {
	Query(ctx context.Context, sql string, args ...interface{}) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, args ...interface{}) pgx.Row
	Exec(ctx context.Context, sql string, args ...interface{}) (pgconn.CommandTag, error)
}

// Pool lazily initialises a pgxpool.Pool from DATABASE_URL and reuses it
// across warm Lambda invocations.
func Pool(ctx context.Context) (*pgxpool.Pool, error) {
	initOnce.Do(func() {
		dsn := os.Getenv("DATABASE_URL")
		cfg, err := pgxpool.ParseConfig(dsn)
		if err != nil {
			initErr = err
			return
		}
		cfg.MaxConns = 5
		pool, initErr = pgxpool.NewWithConfig(ctx, cfg)
	})
	return pool, initErr
}
