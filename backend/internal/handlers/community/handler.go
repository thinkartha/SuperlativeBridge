package community

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

	posts := []models.CommunityPost{}
	rows, err := pool.Query(ctx, `SELECT id, COALESCE(author_id::text,''), author, title, body, category, likes, created_at FROM community_posts ORDER BY created_at DESC`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	for rows.Next() {
		var p models.CommunityPost
		if err := rows.Scan(&p.ID, &p.AuthorID, &p.Author, &p.Title, &p.Body, &p.Category, &p.Likes, &p.CreatedAt); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		posts = append(posts, p)
	}
	rows.Close()

	events_ := []models.CommunityEvent{}
	rows, err = pool.Query(ctx, `SELECT id, title, event_date, type, attendees FROM community_events ORDER BY event_date`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	for rows.Next() {
		var e models.CommunityEvent
		if err := rows.Scan(&e.ID, &e.Title, &e.EventDate, &e.Type, &e.Attendees); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		events_ = append(events_, e)
	}
	rows.Close()

	groups := []models.CommunityGroup{}
	rows, err = pool.Query(ctx, `SELECT id, name, category, members, icon FROM community_groups ORDER BY name`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	for rows.Next() {
		var g models.CommunityGroup
		if err := rows.Scan(&g.ID, &g.Name, &g.Category, &g.Members, &g.Icon); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		groups = append(groups, g)
	}
	rows.Close()

	return response.JSON(200, map[string]interface{}{
		"posts":  posts,
		"events": events_,
		"groups": groups,
	}), nil
}
