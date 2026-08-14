package mentorbookings

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	claims, err := auth.FromRequest(req.Headers)
	if err != nil {
		return response.Error(401, "unauthorized"), nil
	}

	if strings.HasSuffix(req.Resource, "/availability") {
		return getAvailability(ctx, req.PathParameters["id"])
	}
	if strings.HasSuffix(req.Resource, "/bookings") && req.HTTPMethod == "GET" {
		return listForMentor(ctx, req.PathParameters["id"], claims)
	}

	switch req.HTTPMethod {
	case "POST":
		return createBooking(ctx, req, claims)
	case "PATCH":
		return updateBooking(ctx, req, claims)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

// ListForUser is used by the users handler to serve GET /api/users/{uid}/mentor-bookings.
func ListForUser(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT b.id, b.user_id, b.mentor_id, b.scheduled_at, b.duration_minutes, b.topic, b.notes, b.status, b.created_at,
		m.id, m.name, m.email, m.expertise, m.vertical, m.bio, m.rating, m.students, m.status, m.avatar
		FROM mentor_bookings b JOIN mentors m ON m.id = b.mentor_id WHERE b.user_id = $1 ORDER BY b.scheduled_at DESC`, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	bookings := []models.MentorBooking{}
	for rows.Next() {
		var b models.MentorBooking
		var m models.Mentor
		if err := rows.Scan(&b.ID, &b.UserID, &b.MentorID, &b.ScheduledAt, &b.DurationMinutes, &b.Topic, &b.Notes, &b.Status, &b.CreatedAt,
			&m.ID, &m.Name, &m.Email, &m.Expertise, &m.Vertical, &m.Bio, &m.Rating, &m.Students, &m.Status, &m.Avatar); err != nil {
			return response.Error(500, err.Error()), nil
		}
		b.Mentor = &m
		bookings = append(bookings, b)
	}
	return response.JSON(200, bookings), nil
}

// listForMentor returns sessions for a mentor (by mentor id or "me" resolved via email).
func listForMentor(ctx context.Context, mentorID string, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if mentorID == "me" || mentorID == "" {
		err = pool.QueryRow(ctx, `SELECT m.id FROM mentors m JOIN users u ON lower(u.email) = lower(m.email) WHERE u.id = $1`, claims.UserID).Scan(&mentorID)
		if err == pgx.ErrNoRows {
			return response.Error(404, "no mentor profile linked to this account"), nil
		}
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
	} else if claims.Role != "admin" {
		var owner string
		err = pool.QueryRow(ctx, `SELECT u.id::text FROM mentors m JOIN users u ON lower(u.email) = lower(m.email) WHERE m.id = $1`, mentorID).Scan(&owner)
		if err == nil && owner != claims.UserID {
			return response.Error(403, "forbidden"), nil
		}
	}

	rows, err := pool.Query(ctx, `SELECT b.id, b.user_id, b.mentor_id, b.scheduled_at, b.duration_minutes, b.topic, b.notes, b.status, b.created_at,
		m.id, m.name, m.email, m.expertise, m.vertical, m.bio, m.rating, m.students, m.status, m.avatar,
		u.name, u.email
		FROM mentor_bookings b
		JOIN mentors m ON m.id = b.mentor_id
		JOIN users u ON u.id = b.user_id
		WHERE b.mentor_id = $1
		ORDER BY b.scheduled_at DESC`, mentorID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	type bookingOut struct {
		models.MentorBooking
		LearnerName  string `json:"learnerName"`
		LearnerEmail string `json:"learnerEmail"`
	}
	out := []bookingOut{}
	for rows.Next() {
		var b models.MentorBooking
		var m models.Mentor
		var learnerName, learnerEmail string
		if err := rows.Scan(&b.ID, &b.UserID, &b.MentorID, &b.ScheduledAt, &b.DurationMinutes, &b.Topic, &b.Notes, &b.Status, &b.CreatedAt,
			&m.ID, &m.Name, &m.Email, &m.Expertise, &m.Vertical, &m.Bio, &m.Rating, &m.Students, &m.Status, &m.Avatar,
			&learnerName, &learnerEmail); err != nil {
			return response.Error(500, err.Error()), nil
		}
		b.Mentor = &m
		out = append(out, bookingOut{MentorBooking: b, LearnerName: learnerName, LearnerEmail: learnerEmail})
	}
	return response.JSON(200, out), nil
}

func createBooking(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	var body struct {
		MentorID        string `json:"mentorId"`
		ScheduledAt     string `json:"scheduledAt"`
		DurationMinutes int    `json:"durationMinutes"`
		Topic           string `json:"topic"`
		Notes           string `json:"notes"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil || body.MentorID == "" || body.ScheduledAt == "" || body.Topic == "" {
		return response.Error(400, "invalid body"), nil
	}
	scheduledAt, err := time.Parse(time.RFC3339, body.ScheduledAt)
	if err != nil {
		return response.Error(400, "invalid scheduledAt"), nil
	}
	if body.DurationMinutes != 30 && body.DurationMinutes != 45 && body.DurationMinutes != 60 {
		body.DurationMinutes = 30
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var b models.MentorBooking
	err = pool.QueryRow(ctx, `INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
		VALUES ($1,$2,$3,$4,$5,$6,'requested')
		RETURNING id, user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status, created_at`,
		claims.UserID, body.MentorID, scheduledAt, body.DurationMinutes, body.Topic, body.Notes).
		Scan(&b.ID, &b.UserID, &b.MentorID, &b.ScheduledAt, &b.DurationMinutes, &b.Topic, &b.Notes, &b.Status, &b.CreatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, b), nil
}

func updateBooking(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var body struct {
		Status      *string `json:"status"`
		ScheduledAt *string `json:"scheduledAt"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var ownerID string
	err = pool.QueryRow(ctx, `SELECT user_id FROM mentor_bookings WHERE id = $1`, id).Scan(&ownerID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "booking not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if claims.Role != "admin" && claims.UserID != ownerID {
		return response.Error(403, "forbidden"), nil
	}

	var scheduledAt *time.Time
	if body.ScheduledAt != nil {
		t, err := time.Parse(time.RFC3339, *body.ScheduledAt)
		if err != nil {
			return response.Error(400, "invalid scheduledAt"), nil
		}
		scheduledAt = &t
	}

	_, err = pool.Exec(ctx, `UPDATE mentor_bookings SET
			status = COALESCE($1, status),
			scheduled_at = COALESCE($2, scheduled_at)
		WHERE id = $3`, body.Status, scheduledAt, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var b models.MentorBooking
	err = pool.QueryRow(ctx, `SELECT id, user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status, created_at FROM mentor_bookings WHERE id = $1`, id).
		Scan(&b.ID, &b.UserID, &b.MentorID, &b.ScheduledAt, &b.DurationMinutes, &b.Topic, &b.Notes, &b.Status, &b.CreatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, b), nil
}

func getAvailability(ctx context.Context, mentorID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var exists bool
	if err := pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM mentors WHERE id = $1)`, mentorID).Scan(&exists); err != nil {
		return response.Error(500, err.Error()), nil
	}
	if !exists {
		return response.Error(404, "mentor not found"), nil
	}

	rows, err := pool.Query(ctx, `SELECT scheduled_at, duration_minutes FROM mentor_bookings
		WHERE mentor_id = $1 AND status IN ('requested','confirmed') AND scheduled_at BETWEEN now() AND now() + interval '7 days'`, mentorID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	type booked struct {
		start time.Time
		end   time.Time
	}
	var busy []booked
	for rows.Next() {
		var start time.Time
		var duration int
		if err := rows.Scan(&start, &duration); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		busy = append(busy, booked{start: start, end: start.Add(time.Duration(duration) * time.Minute)})
	}
	rows.Close()

	type slot struct {
		Start     time.Time `json:"start"`
		End       time.Time `json:"end"`
		Available bool      `json:"available"`
	}
	slots := []slot{}
	now := time.Now().UTC()
	dayStart := time.Date(now.Year(), now.Month(), now.Day(), 9, 0, 0, 0, time.UTC)
	for day := 0; day < 7; day++ {
		base := dayStart.AddDate(0, 0, day)
		for h := 0; h < 16; h++ { // 9:00-17:00 in 30-min slots
			start := base.Add(time.Duration(h) * 30 * time.Minute)
			end := start.Add(30 * time.Minute)
			if start.Before(now) {
				continue
			}
			available := true
			for _, b := range busy {
				if start.Before(b.end) && end.After(b.start) {
					available = false
					break
				}
			}
			slots = append(slots, slot{Start: start, End: end, Available: available})
		}
	}

	return response.JSON(200, map[string]interface{}{
		"mentorId": mentorID,
		"slots":    slots,
	}), nil
}
