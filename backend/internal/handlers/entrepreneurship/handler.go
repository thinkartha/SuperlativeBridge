package entrepreneurship

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

	tracks := []models.EntrepreneurshipTrack{}
	rows, err := pool.Query(ctx, `SELECT id, title, description, icon, "order" FROM entrepreneurship_tracks ORDER BY "order"`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	for rows.Next() {
		var t models.EntrepreneurshipTrack
		if err := rows.Scan(&t.ID, &t.Title, &t.Description, &t.Icon, &t.Order); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		tracks = append(tracks, t)
	}
	rows.Close()

	resources := []models.EntrepreneurshipResource{}
	rows, err = pool.Query(ctx, `SELECT id, category, title, description, icon, items FROM entrepreneurship_resources ORDER BY category`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	for rows.Next() {
		var r models.EntrepreneurshipResource
		if err := rows.Scan(&r.ID, &r.Category, &r.Title, &r.Description, &r.Icon, &r.Items); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		resources = append(resources, r)
	}
	rows.Close()

	var trackCount, resourceCount, milestoneCount int
	pool.QueryRow(ctx, `SELECT count(*) FROM entrepreneurship_tracks`).Scan(&trackCount)
	pool.QueryRow(ctx, `SELECT count(*) FROM entrepreneurship_resources`).Scan(&resourceCount)
	milestoneCount = 0

	stats := map[string]interface{}{
		"tracks":     trackCount,
		"resources":  resourceCount,
		"milestones": milestoneCount,
	}

	milestones := []map[string]interface{}{}

	return response.JSON(200, map[string]interface{}{
		"tracks":     tracks,
		"resources":  resources,
		"stats":      stats,
		"milestones": milestones,
	}), nil
}
