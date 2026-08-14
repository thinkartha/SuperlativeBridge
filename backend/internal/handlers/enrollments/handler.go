package enrollments

import (
	"context"
	"encoding/json"
	"strings"

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

	if strings.Contains(req.Resource, "/quiz-attempts") {
		if req.HTTPMethod == "POST" {
			return createQuizAttempt(ctx, req, claims)
		}
		return response.Error(405, "method not allowed"), nil
	}

	switch req.HTTPMethod {
	case "POST":
		return createEnrollment(ctx, req, claims)
	case "PATCH":
		return updateEnrollment(ctx, req, claims)
	case "DELETE":
		return deleteEnrollment(ctx, req, claims)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func AttachProgress(ctx context.Context, pool db.Queryer, e *models.Enrollment) {
	e.CompletedModuleIDs = []string{}
	e.QuizAttempts = []models.QuizAttempt{}
	rows, err := pool.Query(ctx, `SELECT module_id FROM enrollment_module_progress WHERE enrollment_id = $1 ORDER BY completed_at`, e.ID)
	if err == nil {
		for rows.Next() {
			var id string
			if rows.Scan(&id) == nil {
				e.CompletedModuleIDs = append(e.CompletedModuleIDs, id)
			}
		}
		rows.Close()
	}
	arows, err := pool.Query(ctx, `SELECT id, user_id, quiz_id, COALESCE(enrollment_id::text, ''), score, passed, created_at
		FROM quiz_attempts WHERE enrollment_id = $1 ORDER BY created_at DESC`, e.ID)
	if err == nil {
		for arows.Next() {
			var a models.QuizAttempt
			if arows.Scan(&a.ID, &a.UserID, &a.QuizID, &a.EnrollmentID, &a.Score, &a.Passed, &a.CreatedAt) == nil {
				e.QuizAttempts = append(e.QuizAttempts, a)
			}
		}
		arows.Close()
	}
}

func scanEnrollment(row pgx.Row) (models.Enrollment, error) {
	var e models.Enrollment
	var lastModuleID *string
	err := row.Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt)
	_ = lastModuleID
	return e, err
}

func createEnrollment(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
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

	var e models.Enrollment
	var lastModuleID *string
	err = pool.QueryRow(ctx, `SELECT id, user_id, course_id, progress, xp, grade, last_module_id, enrolled_at, updated_at FROM enrollments WHERE user_id = $1 AND course_id = $2`,
		claims.UserID, body.CourseID).Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt)
	if err == nil {
		if lastModuleID != nil {
			e.LastModuleID = *lastModuleID
		}
		AttachProgress(ctx, pool, &e)
		return response.JSON(200, e), nil
	}
	if err != pgx.ErrNoRows {
		return response.Error(500, err.Error()), nil
	}

	err = pool.QueryRow(ctx, `INSERT INTO enrollments (user_id, course_id) VALUES ($1, $2)
		RETURNING id, user_id, course_id, progress, xp, grade, last_module_id, enrolled_at, updated_at`,
		claims.UserID, body.CourseID).Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if lastModuleID != nil {
		e.LastModuleID = *lastModuleID
	}
	AttachProgress(ctx, pool, &e)
	return response.JSON(201, e), nil
}

func updateEnrollment(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var body struct {
		Progress     *int    `json:"progress"`
		XP           *int    `json:"xp"`
		Grade        *string `json:"grade"`
		LastModuleID *string `json:"lastModuleId"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var ownerID string
	err = pool.QueryRow(ctx, `SELECT user_id FROM enrollments WHERE id = $1`, id).Scan(&ownerID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "enrollment not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if claims.Role != "admin" && claims.UserID != ownerID {
		return response.Error(403, "forbidden"), nil
	}

	_, err = pool.Exec(ctx, `UPDATE enrollments SET
			progress = COALESCE($1, progress),
			xp = COALESCE($2, xp),
			grade = COALESCE($3, grade),
			last_module_id = COALESCE($4, last_module_id),
			updated_at = now()
		WHERE id = $5`,
		body.Progress, body.XP, body.Grade, body.LastModuleID, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	if body.LastModuleID != nil && *body.LastModuleID != "" {
		_, _ = pool.Exec(ctx, `INSERT INTO enrollment_module_progress (enrollment_id, module_id)
			VALUES ($1, $2) ON CONFLICT (enrollment_id, module_id) DO NOTHING`, id, *body.LastModuleID)
		var done, total int
		_ = pool.QueryRow(ctx, `SELECT count(*) FROM enrollment_module_progress WHERE enrollment_id = $1`, id).Scan(&done)
		_ = pool.QueryRow(ctx, `SELECT count(*) FROM modules WHERE course_id = (SELECT course_id FROM enrollments WHERE id = $1)`, id).Scan(&total)
		if total > 0 {
			pct := (done * 100) / total
			_, _ = pool.Exec(ctx, `UPDATE enrollments SET progress = $1 WHERE id = $2`, pct, id)
		}
	}

	var e models.Enrollment
	var lastModuleID *string
	err = pool.QueryRow(ctx, `SELECT id, user_id, course_id, progress, xp, grade, last_module_id, enrolled_at, updated_at FROM enrollments WHERE id = $1`, id).
		Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if lastModuleID != nil {
		e.LastModuleID = *lastModuleID
	}
	AttachProgress(ctx, pool, &e)
	return response.JSON(200, e), nil
}

func createQuizAttempt(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	var body struct {
		QuizID  string `json:"quizId"`
		Answers []int  `json:"answers"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil || body.QuizID == "" {
		return response.Error(400, "invalid body"), nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var questionsRaw []byte
	var passScore, xpReward int
	var moduleID string
	err = pool.QueryRow(ctx, `SELECT q.questions, q.pass_score, q.xp_reward, q.module_id
		FROM quizzes q WHERE q.id = $1`, body.QuizID).Scan(&questionsRaw, &passScore, &xpReward, &moduleID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "quiz not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var questions []models.QuizQuestion
	_ = json.Unmarshal(questionsRaw, &questions)
	correct := 0
	for i, q := range questions {
		if i < len(body.Answers) && body.Answers[i] == q.Answer {
			correct++
		}
	}
	score := 0
	if len(questions) > 0 {
		score = (correct * 100) / len(questions)
	}
	passed := score >= passScore

	var courseID string
	_ = pool.QueryRow(ctx, `SELECT course_id FROM modules WHERE id = $1`, moduleID).Scan(&courseID)
	var enrollmentID *string
	var eid string
	err = pool.QueryRow(ctx, `SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2`, claims.UserID, courseID).Scan(&eid)
	if err == nil {
		enrollmentID = &eid
	}

	answersJSON, _ := json.Marshal(body.Answers)
	var a models.QuizAttempt
	err = pool.QueryRow(ctx, `INSERT INTO quiz_attempts (user_id, quiz_id, enrollment_id, score, passed, answers)
		VALUES ($1,$2,$3,$4,$5,$6)
		RETURNING id, user_id, quiz_id, COALESCE(enrollment_id::text, ''), score, passed, created_at`,
		claims.UserID, body.QuizID, enrollmentID, score, passed, answersJSON).
		Scan(&a.ID, &a.UserID, &a.QuizID, &a.EnrollmentID, &a.Score, &a.Passed, &a.CreatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	a.Answers = body.Answers

	if passed && enrollmentID != nil {
		var already bool
		_ = pool.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM quiz_attempts WHERE enrollment_id = $1 AND quiz_id = $2 AND passed AND id <> $3)`,
			*enrollmentID, body.QuizID, a.ID).Scan(&already)
		if !already {
			_, _ = pool.Exec(ctx, `UPDATE enrollments SET xp = xp + $1 WHERE id = $2`, xpReward, *enrollmentID)
		}
	}

	return response.JSON(201, a), nil
}

func deleteEnrollment(ctx context.Context, req events.APIGatewayProxyRequest, claims *auth.Claims) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var ownerID string
	err = pool.QueryRow(ctx, `SELECT user_id FROM enrollments WHERE id = $1`, id).Scan(&ownerID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "enrollment not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if claims.Role != "admin" && claims.UserID != ownerID {
		return response.Error(403, "forbidden"), nil
	}

	_, err = pool.Exec(ctx, `DELETE FROM enrollments WHERE id = $1`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}
