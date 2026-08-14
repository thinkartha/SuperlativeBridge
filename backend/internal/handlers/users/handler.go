package users

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	enrollmentsapi "github.com/superlativebridge/backend/internal/handlers/enrollments"
	"github.com/superlativebridge/backend/internal/handlers/mentorbookings"
	"github.com/superlativebridge/backend/internal/handlers/savedcourses"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id, hasID := req.PathParameters["id"]

	switch {
	case strings.HasSuffix(req.Resource, "/analytics"):
		return getUserAnalytics(ctx, id)
	case strings.HasSuffix(req.Resource, "/dashboard"):
		return getDashboard(ctx, id)
	case strings.HasSuffix(req.Resource, "/enrollments"):
		claims, err := auth.FromRequest(req.Headers)
		if err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		if claims.Role != "admin" && claims.UserID != id {
			return response.Error(403, "forbidden"), nil
		}
		return getEnrollments(ctx, id)
	case strings.HasSuffix(req.Resource, "/saved-courses"):
		claims, err := auth.FromRequest(req.Headers)
		if err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		if claims.Role != "admin" && claims.UserID != id {
			return response.Error(403, "forbidden"), nil
		}
		return savedcourses.ListForUser(ctx, id)
	case strings.HasSuffix(req.Resource, "/mentor-bookings"):
		claims, err := auth.FromRequest(req.Headers)
		if err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		if claims.Role != "admin" && claims.UserID != id {
			return response.Error(403, "forbidden"), nil
		}
		return mentorbookings.ListForUser(ctx, id)
	case strings.HasSuffix(req.Resource, "/certifications"):
		return getCertifications(ctx, id)
	case strings.HasSuffix(req.Resource, "/notifications"):
		return getNotifications(ctx, id)
	}

	switch req.HTTPMethod {
	case "GET":
		if hasID && id != "" {
			return getUser(ctx, id)
		}
		return listUsers(ctx, req)
	case "POST":
		return createUser(ctx, req)
	case "PUT":
		return updateUser(ctx, req)
	case "DELETE":
		return deleteUser(ctx, req)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func loadSkills(ctx context.Context, userID string) ([]string, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := pool.Query(ctx, `SELECT name FROM skills WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	skills := []string{}
	for rows.Next() {
		var s string
		if err := rows.Scan(&s); err != nil {
			return nil, err
		}
		skills = append(skills, s)
	}
	return skills, nil
}

func listUsers(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	query := `SELECT id, name, email, role, vertical, location, phone, bio, avatar, created_at, status FROM users WHERE 1=1`
	args := []interface{}{}
	idx := 1
	if v := req.QueryStringParameters["role"]; v != "" {
		query += " AND role = $" + strconv.Itoa(idx)
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["search"]; v != "" {
		query += " AND (name ILIKE $" + strconv.Itoa(idx) + " OR email ILIKE $" + strconv.Itoa(idx) + ")"
		args = append(args, "%"+v+"%")
		idx++
	}
	query += " ORDER BY created_at DESC"
	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Vertical, &u.Location, &u.Phone, &u.Bio, &u.Avatar, &u.CreatedAt, &u.Status); err != nil {
			return response.Error(500, err.Error()), nil
		}
		u.Skills = []string{}
		users = append(users, u)
	}
	return response.JSON(200, users), nil
}

func getUser(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var u models.User
	err = pool.QueryRow(ctx, `SELECT id, name, email, role, vertical, location, phone, bio, avatar, created_at, status FROM users WHERE id = $1`, id).
		Scan(&u.ID, &u.Name, &u.Email, &u.Role, &u.Vertical, &u.Location, &u.Phone, &u.Bio, &u.Avatar, &u.CreatedAt, &u.Status)
	if err == pgx.ErrNoRows {
		return response.Error(404, "user not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	skills, err := loadSkills(ctx, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	u.Skills = skills
	return response.JSON(200, u), nil
}

func createUser(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var body struct {
		models.User
		Password string `json:"password"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	u := body.User
	if u.Status == "" {
		u.Status = "Active"
	}
	passwordHash := ""
	if body.Password != "" {
		hash, err := auth.HashPassword(body.Password)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		passwordHash = hash
	} else {
		hash, _ := auth.HashPassword("password123")
		passwordHash = hash
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	err = pool.QueryRow(ctx, `INSERT INTO users (name, email, password_hash, role, vertical, location, phone, bio, avatar, status)
		VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id, created_at`,
		u.Name, u.Email, passwordHash, u.Role, u.Vertical, u.Location, u.Phone, u.Bio, u.Avatar, u.Status).Scan(&u.ID, &u.CreatedAt)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	u.Skills = []string{}
	return response.JSON(201, u), nil
}

func updateUser(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var u models.User
	if err := json.Unmarshal([]byte(req.Body), &u); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	u.ID = id
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `UPDATE users SET name=$1, email=$2, role=$3, vertical=$4, location=$5, phone=$6, bio=$7, avatar=$8, status=$9 WHERE id=$10`,
		u.Name, u.Email, u.Role, u.Vertical, u.Location, u.Phone, u.Bio, u.Avatar, u.Status, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, u), nil
}

func deleteUser(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `DELETE FROM users WHERE id=$1`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}

func getEnrollments(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT e.id, e.user_id, e.course_id, e.progress, e.xp, e.grade, e.last_module_id, e.enrolled_at, e.updated_at,
		c.id, c.title, c.description, c.category, c.vertical, c.language, c.level, c.duration, c.students, c.rating, c.instructor, c.image, c.status
		FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	enrollments := []models.Enrollment{}
	for rows.Next() {
		var e models.Enrollment
		var c models.Course
		var lastModuleID *string
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt,
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Vertical, &c.Language, &c.Level, &c.Duration, &c.Students, &c.Rating, &c.Instructor, &c.Image, &c.Status); err != nil {
			return response.Error(500, err.Error()), nil
		}
		if lastModuleID != nil {
			e.LastModuleID = *lastModuleID
		}
		e.Course = &c
		enrollmentsapi.AttachProgress(ctx, pool, &e)
		enrollments = append(enrollments, e)
	}
	return response.JSON(200, enrollments), nil
}

func getCertifications(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	certs, err := loadCertifications(ctx, pool, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, certs), nil
}

func loadCertifications(ctx context.Context, pool db.Queryer, userID string) ([]models.Certification, error) {
	rows, err := pool.Query(ctx, `SELECT id, user_id, name, issuer, expires_at, status FROM certifications WHERE user_id = $1 ORDER BY expires_at`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	certs := []models.Certification{}
	for rows.Next() {
		var c models.Certification
		if err := rows.Scan(&c.ID, &c.UserID, &c.Name, &c.Issuer, &c.ExpiresAt, &c.Status); err != nil {
			return nil, err
		}
		if c.ExpiresAt != nil {
			days := int(time.Until(*c.ExpiresAt).Hours() / 24)
			c.DaysLeft = days
		}
		certs = append(certs, c)
	}
	return certs, nil
}

func getNotifications(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	notifs, err := loadNotifications(ctx, pool, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, notifs), nil
}

func loadNotifications(ctx context.Context, pool db.Queryer, userID string) ([]models.Notification, error) {
	rows, err := pool.Query(ctx, `SELECT id, user_id, type, message, read, created_at FROM notifications WHERE user_id = $1 ORDER BY created_at DESC`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	notifs := []models.Notification{}
	for rows.Next() {
		var n models.Notification
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Message, &n.Read, &n.CreatedAt); err != nil {
			return nil, err
		}
		notifs = append(notifs, n)
	}
	return notifs, nil
}

func getDashboard(ctx context.Context, userID string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	skills, err := loadSkills(ctx, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	certs, err := loadCertifications(ctx, pool, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	notifs, err := loadNotifications(ctx, pool, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	rows, err := pool.Query(ctx, `SELECT e.id, e.user_id, e.course_id, e.progress, e.xp, e.grade, e.last_module_id, e.enrolled_at, e.updated_at,
		c.id, c.title, c.description, c.category, c.vertical, c.language, c.level, c.duration, c.students, c.rating, c.instructor, c.image, c.status
		FROM enrollments e JOIN courses c ON c.id = e.course_id WHERE e.user_id = $1 ORDER BY e.enrolled_at DESC`, userID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	enrollments := []models.Enrollment{}
	totalXP := 0
	for rows.Next() {
		var e models.Enrollment
		var c models.Course
		var lastModuleID *string
		if err := rows.Scan(&e.ID, &e.UserID, &e.CourseID, &e.Progress, &e.XP, &e.Grade, &lastModuleID, &e.EnrolledAt, &e.UpdatedAt,
			&c.ID, &c.Title, &c.Description, &c.Category, &c.Vertical, &c.Language, &c.Level, &c.Duration, &c.Students, &c.Rating, &c.Instructor, &c.Image, &c.Status); err != nil {
			rows.Close()
			return response.Error(500, err.Error()), nil
		}
		if lastModuleID != nil {
			e.LastModuleID = *lastModuleID
		}
		e.Course = &c
		enrollmentsapi.AttachProgress(ctx, pool, &e)
		totalXP += e.XP
		enrollments = append(enrollments, e)
	}
	rows.Close()

	stats := map[string]interface{}{
		"coursesEnrolled": len(enrollments),
		"totalXP":         totalXP,
		"certifications":  len(certs),
		"skills":          len(skills),
	}

	activity := []map[string]interface{}{}
	for _, n := range notifs {
		activity = append(activity, map[string]interface{}{
			"type":      n.Type,
			"message":   n.Message,
			"createdAt": n.CreatedAt,
		})
	}

	dashboard := map[string]interface{}{
		"stats":          stats,
		"certifications": certs,
		"notifications":  notifs,
		"skills":         skills,
		"enrollments":    enrollments,
		"activity":       activity,
	}
	return response.JSON(200, dashboard), nil
}

func getUserAnalytics(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	if id == "" {
		return response.Error(400, "missing user id"), nil
	}
	userRes, err := getUser(ctx, id)
	if err != nil || userRes.StatusCode >= 400 {
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		return userRes, nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var enrollments, completed, avgProgress, totalXP int
	pool.QueryRow(ctx, `
		SELECT count(*), count(*) FILTER (WHERE progress = 100),
			COALESCE(AVG(progress), 0)::int, COALESCE(SUM(xp), 0)
		FROM enrollments WHERE user_id = $1`, id).Scan(&enrollments, &completed, &avgProgress, &totalXP)

	var bookings, upcoming, completedBookings int
	pool.QueryRow(ctx, `
		SELECT count(*),
			count(*) FILTER (WHERE status IN ('requested','confirmed') AND scheduled_at >= now()),
			count(*) FILTER (WHERE status = 'completed')
		FROM mentor_bookings WHERE user_id = $1`, id).Scan(&bookings, &upcoming, &completedBookings)

	skills, _ := loadSkills(ctx, id)
	certs, _ := loadCertifications(ctx, pool, id)
	notifs, _ := loadNotifications(ctx, pool, id)

	enrollRes, _ := getEnrollments(ctx, id)
	var enrollList []models.Enrollment
	_ = json.Unmarshal([]byte(enrollRes.Body), &enrollList)

	bookRes, _ := mentorbookings.ListForUser(ctx, id)
	var bookList []models.MentorBooking
	_ = json.Unmarshal([]byte(bookRes.Body), &bookList)

	var user models.User
	_ = json.Unmarshal([]byte(userRes.Body), &user)

	unread := 0
	for _, n := range notifs {
		if !n.Read {
			unread++
		}
	}

	return response.JSON(200, map[string]interface{}{
		"user": user,
		"metrics": map[string]interface{}{
			"enrollments":         enrollments,
			"completedCourses":    completed,
			"avgProgress":         avgProgress,
			"totalXP":             totalXP,
			"bookings":            bookings,
			"upcomingBookings":    upcoming,
			"completedBookings":   completedBookings,
			"certifications":      len(certs),
			"unreadNotifications": unread,
		},
		"skills":         skills,
		"certifications": certs,
		"enrollments":    enrollList,
		"bookings":       bookList,
		"notifications":  notifs,
	}), nil
}
