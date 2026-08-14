package marketplace

import (
	"context"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	query := `SELECT id, name, vertical, description, location, founded, employees, tags FROM marketplace_entries WHERE 1=1`
	args := []interface{}{}
	idx := 1
	if v := req.QueryStringParameters["vertical"]; v != "" {
		query += " AND vertical = $1"
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["search"]; v != "" {
		if idx == 1 {
			query += " AND name ILIKE $1"
		} else {
			query += " AND name ILIKE $2"
		}
		args = append(args, "%"+v+"%")
	}
	query += " ORDER BY name"
	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	entries := []models.MarketplaceEntry{}
	for rows.Next() {
		var e models.MarketplaceEntry
		if err := rows.Scan(&e.ID, &e.Name, &e.Vertical, &e.Description, &e.Location, &e.Founded, &e.Employees, &e.Tags); err != nil {
			return response.Error(500, err.Error()), nil
		}
		entries = append(entries, e)
	}
	return response.JSON(200, entries), nil
}
