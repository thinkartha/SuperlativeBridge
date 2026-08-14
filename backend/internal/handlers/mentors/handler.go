package mentors

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.HTTPMethod {
	case "GET":
		if strings.HasSuffix(req.Resource, "/analytics") {
			return getMentorAnalytics(ctx, req.PathParameters["id"])
		}
		if id, ok := req.PathParameters["id"]; ok && id != "" {
			return getMentor(ctx, id)
		}
		return listMentors(ctx, req)
	case "POST":
		return createMentor(ctx, req)
	case "PUT":
		return updateMentor(ctx, req)
	case "DELETE":
		return deleteMentor(ctx, req)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func scanMentor(row pgx.Row) (models.Mentor, error) {
	var m models.Mentor
	err := row.Scan(&m.ID, &m.Name, &m.Email, &m.Expertise, &m.Vertical, &m.Bio, &m.Rating, &m.Students, &m.Status, &m.Avatar)
	return m, err
}

func listMentors(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	query := `SELECT id, name, email, expertise, vertical, bio, rating, students, status, avatar FROM mentors WHERE 1=1`
	args := []interface{}{}
	idx := 1
	if v := req.QueryStringParameters["search"]; v != "" {
		query += " AND name ILIKE $1"
		args = append(args, "%"+v+"%")
		idx++
	}
	if v := req.QueryStringParameters["status"]; v != "" {
		query += " AND status = $" + strconv.Itoa(idx)
		args = append(args, v)
	}
	query += " ORDER BY name"
	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	mentors := []models.Mentor{}
	for rows.Next() {
		m, err := scanMentor(rows)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		mentors = append(mentors, m)
	}
	return response.JSON(200, mentors), nil
}

func getMentor(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	m, err := scanMentor(pool.QueryRow(ctx, `SELECT id, name, email, expertise, vertical, bio, rating, students, status, avatar FROM mentors WHERE id = $1`, id))
	if err == pgx.ErrNoRows {
		return response.Error(404, "mentor not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, m), nil
}

func createMentor(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var m models.Mentor
	if err := json.Unmarshal([]byte(req.Body), &m); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	if m.Status == "" {
		m.Status = "Active"
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	err = pool.QueryRow(ctx, `INSERT INTO mentors (name, email, expertise, vertical, bio, rating, students, status, avatar) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
		m.Name, m.Email, m.Expertise, m.Vertical, m.Bio, m.Rating, m.Students, m.Status, m.Avatar).Scan(&m.ID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, m), nil
}

func updateMentor(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var m models.Mentor
	if err := json.Unmarshal([]byte(req.Body), &m); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	m.ID = id
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `UPDATE mentors SET name=$1, email=$2, expertise=$3, vertical=$4, bio=$5, rating=$6, students=$7, status=$8, avatar=$9 WHERE id=$10`,
		m.Name, m.Email, m.Expertise, m.Vertical, m.Bio, m.Rating, m.Students, m.Status, m.Avatar, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, m), nil
}

func deleteMentor(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `DELETE FROM mentors WHERE id=$1`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}

func getMentorAnalytics(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	if id == "" {
		return response.Error(400, "missing mentor id"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	m, err := scanMentor(pool.QueryRow(ctx, `SELECT id, name, email, expertise, vertical, bio, rating, students, status, avatar FROM mentors WHERE id = $1`, id))
	if err == pgx.ErrNoRows {
		return response.Error(404, "mentor not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	rows, err := pool.Query(ctx, `
		SELECT b.id, b.user_id, b.scheduled_at, b.duration_minutes, b.topic, b.notes, b.status, b.created_at,
			u.name, u.email
		FROM mentor_bookings b
		JOIN users u ON u.id = b.user_id
		WHERE b.mentor_id = $1
		ORDER BY b.scheduled_at DESC`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	bookings := []map[string]interface{}{}
	byStatus := map[string]int{"requested": 0, "confirmed": 0, "completed": 0, "cancelled": 0}
	upcoming := 0
	for rows.Next() {
		var bid, uid, topic, notes, status, uname, uemail string
		var scheduled, created interface{}
		var duration int
		if err := rows.Scan(&bid, &uid, &scheduled, &duration, &topic, &notes, &status, &created, &uname, &uemail); err != nil {
			return response.Error(500, err.Error()), nil
		}
		byStatus[status]++
		bookings = append(bookings, map[string]interface{}{
			"id":              bid,
			"userId":          uid,
			"userName":        uname,
			"userEmail":       uemail,
			"scheduledAt":     scheduled,
			"durationMinutes": duration,
			"topic":           topic,
			"notes":           notes,
			"status":          status,
			"createdAt":       created,
		})
	}
	for _, b := range bookings {
		if (b["status"] == "requested" || b["status"] == "confirmed") {
			upcoming++
		}
	}

	return response.JSON(200, map[string]interface{}{
		"mentor":   m,
		"metrics": map[string]interface{}{
			"totalBookings":  len(bookings),
			"upcoming":       upcoming,
			"completed":      byStatus["completed"],
			"requested":      byStatus["requested"],
			"confirmed":      byStatus["confirmed"],
			"cancelled":      byStatus["cancelled"],
			"rating":         m.Rating,
			"listedStudents": m.Students,
		},
		"byStatus": byStatus,
		"bookings": bookings,
	}), nil
}
