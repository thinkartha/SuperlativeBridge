package courses

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	switch req.HTTPMethod {
	case "GET":
		if id, ok := req.PathParameters["id"]; ok && id != "" {
			return getCourse(ctx, id)
		}
		return listCourses(ctx, req)
	case "POST":
		return createCourse(ctx, req)
	case "PUT":
		return updateCourse(ctx, req)
	case "DELETE":
		return deleteCourse(ctx, req)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func listCourses(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	query := `SELECT id, title, description, category, vertical, language, level, duration, students, rating, instructor, image, status FROM courses WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if v := req.QueryStringParameters["vertical"]; v != "" {
		query += " AND vertical ILIKE $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["category"]; v != "" {
		query += " AND category ILIKE $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["language"]; v != "" {
		query += " AND language ILIKE $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["status"]; v != "" {
		query += " AND status ILIKE $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["level"]; v != "" {
		query += " AND level ILIKE $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["search"]; v != "" {
		query += " AND (title ILIKE $" + strconv.Itoa(idx) + " OR description ILIKE $" + strconv.Itoa(idx) + " OR instructor ILIKE $" + strconv.Itoa(idx) + ")"
		args = append(args, "%"+v+"%")
		idx++
	}
	query += " ORDER BY title"

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	courses := []models.Course{}
	for rows.Next() {
		var c models.Course
		if err := rows.Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Vertical, &c.Language, &c.Level, &c.Duration, &c.Students, &c.Rating, &c.Instructor, &c.Image, &c.Status); err != nil {
			return response.Error(500, err.Error()), nil
		}
		courses = append(courses, c)
	}
	return response.JSON(200, courses), nil
}

func getCourse(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var c models.Course
	var objectivesRaw []byte
	err = pool.QueryRow(ctx, `SELECT id, title, description, category, vertical, language, level, duration, students, rating, instructor, image, status,
		COALESCE(overview, ''), COALESCE(learning_objectives, '[]'::jsonb), COALESCE(audience, '')
		FROM courses WHERE id = $1`, id).
		Scan(&c.ID, &c.Title, &c.Description, &c.Category, &c.Vertical, &c.Language, &c.Level, &c.Duration, &c.Students, &c.Rating, &c.Instructor, &c.Image, &c.Status,
			&c.Overview, &objectivesRaw, &c.Audience)
	if err == nil {
		json.Unmarshal(objectivesRaw, &c.LearningObjectives)
		if c.LearningObjectives == nil {
			c.LearningObjectives = []string{}
		}
	}
	if err == pgx.ErrNoRows {
		return response.Error(404, "course not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	modRows, err := pool.Query(ctx, `SELECT id, course_id, title, "order", video_url, duration, content FROM modules WHERE course_id = $1 ORDER BY "order"`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	modules := []models.Module{}
	for modRows.Next() {
		var m models.Module
		if err := modRows.Scan(&m.ID, &m.CourseID, &m.Title, &m.Order, &m.VideoURL, &m.Duration, &m.Content); err != nil {
			modRows.Close()
			return response.Error(500, err.Error()), nil
		}
		modules = append(modules, m)
	}
	modRows.Close()

	for i := range modules {
		var q models.Quiz
		var questionsRaw []byte
		err := pool.QueryRow(ctx, `SELECT id, module_id, title, pass_score, xp_reward, questions FROM quizzes WHERE module_id = $1`, modules[i].ID).
			Scan(&q.ID, &q.ModuleID, &q.Title, &q.PassScore, &q.XPReward, &questionsRaw)
		if err == nil {
			json.Unmarshal(questionsRaw, &q.Questions)
			if q.Questions == nil {
				q.Questions = []models.QuizQuestion{}
			}
			modules[i].Quiz = &q
		}
	}
	c.Modules = modules

	return response.JSON(200, c), nil
}

func createCourse(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var c models.Course
	if err := json.Unmarshal([]byte(req.Body), &c); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	if c.Status == "" {
		c.Status = "Draft"
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	err = pool.QueryRow(ctx, `INSERT INTO courses (title, description, category, vertical, language, level, duration, students, rating, instructor, image, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
		c.Title, c.Description, c.Category, c.Vertical, c.Language, c.Level, c.Duration, c.Students, c.Rating, c.Instructor, c.Image, c.Status).Scan(&c.ID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, c), nil
}

func updateCourse(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var c models.Course
	if err := json.Unmarshal([]byte(req.Body), &c); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	c.ID = id
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `UPDATE courses SET title=$1, description=$2, category=$3, vertical=$4, language=$5, level=$6, duration=$7, students=$8, rating=$9, instructor=$10, image=$11, status=$12 WHERE id=$13`,
		c.Title, c.Description, c.Category, c.Vertical, c.Language, c.Level, c.Duration, c.Students, c.Rating, c.Instructor, c.Image, c.Status, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, c), nil
}

func deleteCourse(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `DELETE FROM courses WHERE id=$1`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}
