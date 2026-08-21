package savedcourses

import (
	"context"
	"encoding/json"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	claims, err := auth.FromRequest(ctx, req.Headers)
	if err != nil {
		return response.Error(401, "unauthorized"), nil
	}

	switch req.HTTPMethod {
	case "POST":
		return createSavedCourse(ctx, req, claims)
	case "DELETE":
		return deleteSavedCourse(ctx, req, claims)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

// ListForUser is used by the users handler to serve GET /api/users/{uid}/saved-courses.
func ListForUser(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT sc.id, sc.user_id, sc.course_id, sc.saved_at,
		c.id, c.title, c.description, c.category, c.vertical, c.language, c.level, c.duration, c.students, c.rating, c.instructor, c.image, c.status
		FROM saved_courses sc JOIN courses c ON c.id = sc.course_id WHERE sc.user_id = $1 ORDER BY sc.saved_at DESC`, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	saved := []models.SavedCourse{}
	for rows.Next() {
		var sc models.SavedCourse
		var c models.Course
		if err := rows.Scan(&sc.ID, &sc.UserID, &sc.CourseID, &sc.SavedAt,
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Vertical, &c.Language, &c.Level, &c.Duration, &c.Students, &c.Rating, &c.Instructor, &c.Image, &c.Status); err != nil {
			return response.Error(500, err.Error()), nil
		}
		sc.Course = &c
		saved = append(saved, sc)
	}
	return response.JSON(200, saved), nil
}

func createSavedCourse(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	var body struct {
		CourseID string `json:"courseId"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil || body.CourseID == "" {
		return response.Error(400, "invalid body"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var sc models.SavedCourse
	err = pool.QueryRow(ctx, `SELECT id, user_id, course_id, saved_at FROM saved_courses WHERE user_id = $1 AND course_id = $2`,
		claims.UserID, body.CourseID).Scan(&sc.ID, &sc.UserID, &sc.CourseID, &sc.SavedAt)
	if err == nil {
		return response.JSON(200, sc), nil
	}
	if err != pgx.ErrNoRows {
		return response.Error(500, err.Error()), nil
	}

	err = pool.QueryRow(ctx, `INSERT INTO saved_courses (user_id, course_id) VALUES ($1, $2) RETURNING id, user_id, course_id, saved_at`,
		claims.UserID, body.CourseID).Scan(&sc.ID, &sc.UserID, &sc.CourseID, &sc.SavedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, sc), nil
}

func deleteSavedCourse(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	courseID := req.PathParameters["courseId"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `DELETE FROM saved_courses WHERE user_id = $1 AND course_id = $2`, claims.UserID, courseID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}
