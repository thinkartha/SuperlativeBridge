package community

import (
	"context"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if req.HTTPMethod == "POST" && strings.Contains(req.Resource, "/rsvp") {
		return rsvpEvent(ctx, req)
	}
	if req.HTTPMethod == "GET" {
		return listCommunity(ctx)
	}
	return response.Error(405, "method not allowed"), nil
}

func listCommunity(ctx context.Context) (events.APIGatewayProxyResponse, error) {
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

func rsvpEvent(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if _, err := auth.FromRequest(req.Headers); err != nil {
		return response.Error(401, "unauthorized"), nil
	}
	id := req.PathParameters["id"]
	if id == "" {
		return response.Error(400, "missing event id"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var e models.CommunityEvent
	err = pool.QueryRow(ctx, `
		UPDATE community_events
		SET attendees = attendees + 1
		WHERE id = $1
		RETURNING id, title, event_date, type, attendees`, id).
		Scan(&e.ID, &e.Title, &e.EventDate, &e.Type, &e.Attendees)
	if err == pgx.ErrNoRows {
		return response.Error(404, "event not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, map[string]interface{}{
		"event":   e,
		"message": "RSVP confirmed",
	}), nil
}
