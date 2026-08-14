package admin

import (
	"context"
	"encoding/json"
	"strconv"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	res := req.Resource
	switch {
	case strings.Contains(res, "/user-analytics"):
		return userAnalytics(ctx)
	case strings.Contains(res, "/mentor-analytics"):
		return mentorAnalytics(ctx)
	case strings.Contains(res, "/audit-log"):
		return listAuditLog(ctx, req)
	case strings.Contains(res, "/notifications"):
		if req.HTTPMethod == "PATCH" {
			return markNotification(ctx, req)
		}
		return listNotifications(ctx)
	default:
		return getStats(ctx)
	}
}

func getStats(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var totalUsers, totalCourses, totalMentors, totalEnrollments, totalCandidates int
	var activeCourses, employers int
	var completionRate float64
	pool.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&totalUsers)
	pool.QueryRow(ctx, `SELECT count(*) FROM courses`).Scan(&totalCourses)
	pool.QueryRow(ctx, `SELECT count(*) FROM mentors`).Scan(&totalMentors)
	pool.QueryRow(ctx, `SELECT count(*) FROM enrollments`).Scan(&totalEnrollments)
	pool.QueryRow(ctx, `SELECT count(*) FROM candidates`).Scan(&totalCandidates)
	pool.QueryRow(ctx, `SELECT count(*) FROM courses WHERE status = 'Published'`).Scan(&activeCourses)
	pool.QueryRow(ctx, `SELECT count(*) FROM users WHERE role = 'employer'`).Scan(&employers)
	pool.QueryRow(ctx, `
		SELECT COALESCE(ROUND(100.0 * count(*) FILTER (WHERE progress = 100) / NULLIF(count(*), 0), 1), 0)
		FROM enrollments`).Scan(&completionRate)

	rows, err := pool.Query(ctx, `SELECT role, count(*) FROM users GROUP BY role`)
	usersByRole := map[string]int{}
	if err == nil {
		for rows.Next() {
			var role string
			var c int
			rows.Scan(&role, &c)
			usersByRole[role] = c
		}
		rows.Close()
	}

	rows, err = pool.Query(ctx, `SELECT status, count(*) FROM courses GROUP BY status`)
	coursesByStatus := map[string]int{}
	if err == nil {
		for rows.Next() {
			var status string
			var c int
			rows.Scan(&status, &c)
			coursesByStatus[status] = c
		}
		rows.Close()
	}

	recent := []map[string]interface{}{}
	rrows, err := pool.Query(ctx, `
		SELECT name, email, role, created_at
		FROM users ORDER BY created_at DESC LIMIT 12`)
	if err == nil {
		defer rrows.Close()
		for rrows.Next() {
			var name, email, role string
			var created time.Time
			if err := rrows.Scan(&name, &email, &role, &created); err != nil {
				continue
			}
			recent = append(recent, map[string]interface{}{
				"name":  name,
				"email": email,
				"role":  role,
				"date":  created.Format("Jan 2, 2006"),
			})
		}
	}

	stats := map[string]interface{}{
		"totalUsers":       totalUsers,
		"totalCourses":     totalCourses,
		"activeCourses":    activeCourses,
		"totalMentors":     totalMentors,
		"employers":        employers,
		"completionRate":   completionRate,
		"totalEnrollments": totalEnrollments,
		"totalCandidates":  totalCandidates,
		"usersByRole":      usersByRole,
		"coursesByStatus":  coursesByStatus,
		"recentUsers":      recent,
	}
	return response.JSON(200, stats), nil
}

func userAnalytics(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var total, active, newThisMonth int
	pool.QueryRow(ctx, `SELECT count(*) FROM users`).Scan(&total)
	pool.QueryRow(ctx, `SELECT count(*) FROM users WHERE status = 'Active'`).Scan(&active)
	pool.QueryRow(ctx, `SELECT count(*) FROM users WHERE created_at >= date_trunc('month', now())`).Scan(&newThisMonth)

	roleRows, _ := pool.Query(ctx, `SELECT role, count(*) FROM users GROUP BY role`)
	byRole := map[string]int{}
	if roleRows != nil {
		for roleRows.Next() {
			var role string
			var c int
			roleRows.Scan(&role, &c)
			byRole[role] = c
		}
		roleRows.Close()
	}

	var avgEnrollments, completionRate float64
	pool.QueryRow(ctx, `
		SELECT COALESCE(ROUND(avg(cnt)::numeric, 1), 0) FROM (
			SELECT count(e.id) AS cnt FROM users u LEFT JOIN enrollments e ON e.user_id = u.id GROUP BY u.id
		) t`).Scan(&avgEnrollments)
	pool.QueryRow(ctx, `
		SELECT COALESCE(ROUND(100.0 * count(*) FILTER (WHERE progress = 100) / NULLIF(count(*), 0), 1), 0)
		FROM enrollments`).Scan(&completionRate)

	rows, err := pool.Query(ctx, `
		SELECT u.id, u.name, u.email, u.role, u.status, u.created_at, u.vertical, u.location,
			COALESCE(e.cnt, 0), COALESCE(e.completed, 0), COALESCE(e.avg_progress, 0), COALESCE(e.xp, 0),
			COALESCE(b.cnt, 0)
		FROM users u
		LEFT JOIN (
			SELECT user_id, count(*) cnt,
				count(*) FILTER (WHERE progress = 100) completed,
				COALESCE(AVG(progress), 0)::int avg_progress,
				COALESCE(SUM(xp), 0) xp
			FROM enrollments GROUP BY user_id
		) e ON e.user_id = u.id
		LEFT JOIN (
			SELECT user_id, count(*) cnt FROM mentor_bookings GROUP BY user_id
		) b ON b.user_id = u.id
		ORDER BY u.created_at DESC`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	users := []map[string]interface{}{}
	for rows.Next() {
		var id, name, email, role, status, vertical, location string
		var created time.Time
		var enrollments, completed, avgProgress, xp, bookings int
		if err := rows.Scan(&id, &name, &email, &role, &status, &created, &vertical, &location,
			&enrollments, &completed, &avgProgress, &xp, &bookings); err != nil {
			return response.Error(500, err.Error()), nil
		}
		users = append(users, map[string]interface{}{
			"id":           id,
			"name":         name,
			"email":        email,
			"role":         role,
			"status":       status,
			"createdAt":    created,
			"vertical":     vertical,
			"location":     location,
			"enrollments":  enrollments,
			"completed":    completed,
			"avgProgress":  avgProgress,
			"totalXP":      xp,
			"bookings":     bookings,
		})
	}

	return response.JSON(200, map[string]interface{}{
		"summary": map[string]interface{}{
			"total":          total,
			"active":         active,
			"newThisMonth":   newThisMonth,
			"byRole":         byRole,
			"avgEnrollments": avgEnrollments,
			"completionRate": completionRate,
		},
		"users": users,
	}), nil
}

func mentorAnalytics(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var total, active int
	var avgRating float64
	pool.QueryRow(ctx, `SELECT count(*) FROM mentors`).Scan(&total)
	pool.QueryRow(ctx, `SELECT count(*) FROM mentors WHERE status = 'Active'`).Scan(&active)
	pool.QueryRow(ctx, `SELECT COALESCE(ROUND(avg(rating)::numeric, 2), 0) FROM mentors`).Scan(&avgRating)

	var totalBookings, completedBookings int
	pool.QueryRow(ctx, `SELECT count(*) FROM mentor_bookings`).Scan(&totalBookings)
	pool.QueryRow(ctx, `SELECT count(*) FROM mentor_bookings WHERE status = 'completed'`).Scan(&completedBookings)
	completionRate := 0.0
	if totalBookings > 0 {
		completionRate = float64(int(1000*float64(completedBookings)/float64(totalBookings)+0.5)) / 10
	}

	rows, err := pool.Query(ctx, `
		SELECT m.id, m.name, m.email, m.vertical, m.rating, m.students, m.status, m.avatar,
			COALESCE(b.total, 0), COALESCE(b.completed, 0), COALESCE(b.requested, 0),
			COALESCE(b.confirmed, 0), COALESCE(b.cancelled, 0), COALESCE(b.upcoming, 0)
		FROM mentors m
		LEFT JOIN (
			SELECT mentor_id,
				count(*) total,
				count(*) FILTER (WHERE status = 'completed') completed,
				count(*) FILTER (WHERE status = 'requested') requested,
				count(*) FILTER (WHERE status = 'confirmed') confirmed,
				count(*) FILTER (WHERE status = 'cancelled') cancelled,
				count(*) FILTER (WHERE status IN ('requested','confirmed') AND scheduled_at >= now()) upcoming
			FROM mentor_bookings GROUP BY mentor_id
		) b ON b.mentor_id = m.id
		ORDER BY m.name`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	mentors := []map[string]interface{}{}
	for rows.Next() {
		var id, name, email, vertical, status, avatar string
		var rating float64
		var students, totalB, completed, requested, confirmed, cancelled, upcoming int
		if err := rows.Scan(&id, &name, &email, &vertical, &rating, &students, &status, &avatar,
			&totalB, &completed, &requested, &confirmed, &cancelled, &upcoming); err != nil {
			return response.Error(500, err.Error()), nil
		}
		mentors = append(mentors, map[string]interface{}{
			"id":        id,
			"name":      name,
			"email":     email,
			"vertical":  vertical,
			"rating":    rating,
			"students":  students,
			"status":    status,
			"avatar":    avatar,
			"bookings":  totalB,
			"completed": completed,
			"requested": requested,
			"confirmed": confirmed,
			"cancelled": cancelled,
			"upcoming":  upcoming,
		})
	}

	return response.JSON(200, map[string]interface{}{
		"summary": map[string]interface{}{
			"total":          total,
			"active":         active,
			"avgRating":      avgRating,
			"totalBookings":  totalBookings,
			"completionRate": completionRate,
		},
		"mentors": mentors,
	}), nil
}

func listNotifications(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `
		SELECT n.id, n.user_id, n.type, n.message, n.read, n.created_at, u.name, u.email
		FROM notifications n
		JOIN users u ON u.id = n.user_id
		ORDER BY n.created_at DESC
		LIMIT 100`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	unread := 0
	for rows.Next() {
		var n models.Notification
		var name, email string
		if err := rows.Scan(&n.ID, &n.UserID, &n.Type, &n.Message, &n.Read, &n.CreatedAt, &name, &email); err != nil {
			return response.Error(500, err.Error()), nil
		}
		if !n.Read {
			unread++
		}
		items = append(items, map[string]interface{}{
			"id":        n.ID,
			"userId":    n.UserID,
			"type":      n.Type,
			"message":   n.Message,
			"read":      n.Read,
			"createdAt": n.CreatedAt,
			"userName":  name,
			"userEmail": email,
		})
	}
	return response.JSON(200, map[string]interface{}{
		"unread":        unread,
		"notifications": items,
	}), nil
}

func markNotification(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	if id == "" {
		return response.Error(400, "missing notification id"), nil
	}
	var body struct {
		Read *bool `json:"read"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil || body.Read == nil {
		return response.Error(400, "read is required"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	tag, err := pool.Exec(ctx, `UPDATE notifications SET read = $1 WHERE id = $2`, *body.Read, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if tag.RowsAffected() == 0 {
		return response.Error(404, "notification not found"), nil
	}
	return response.JSON(200, map[string]interface{}{"id": id, "read": *body.Read}), nil
}

func listAuditLog(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	page, _ := strconv.Atoi(req.QueryStringParameters["page"])
	if page < 1 {
		page = 1
	}
	pageSize, _ := strconv.Atoi(req.QueryStringParameters["pageSize"])
	if pageSize < 1 || pageSize > 100 {
		pageSize = 20
	}

	query := `SELECT id, table_name, record_id, action, actor_id, actor_email, old_data, new_data, changed_at
		FROM audit_log WHERE 1=1`
	countQuery := `SELECT count(*) FROM audit_log WHERE 1=1`
	args := []interface{}{}
	idx := 1

	if v := req.QueryStringParameters["table"]; v != "" {
		clause := " AND table_name = $" + strconv.Itoa(idx)
		query += clause
		countQuery += clause
		args = append(args, v)
		idx++
	}
	if v := req.QueryStringParameters["action"]; v != "" {
		clause := " AND action = $" + strconv.Itoa(idx)
		query += clause
		countQuery += clause
		args = append(args, strings.ToUpper(v))
		idx++
	}
	if v := req.QueryStringParameters["search"]; v != "" {
		clause := " AND (table_name ILIKE $" + strconv.Itoa(idx) + " OR actor_email ILIKE $" + strconv.Itoa(idx) + " OR record_id ILIKE $" + strconv.Itoa(idx) + " OR coalesce(new_data::text,'') ILIKE $" + strconv.Itoa(idx) + ")"
		query += clause
		countQuery += clause
		args = append(args, "%"+v+"%")
		idx++
	}

	var total int
	if err := pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return response.Error(500, err.Error()), nil
	}

	query += " ORDER BY changed_at DESC LIMIT $" + strconv.Itoa(idx) + " OFFSET $" + strconv.Itoa(idx+1)
	args = append(args, pageSize, (page-1)*pageSize)

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()

	items := []map[string]interface{}{}
	for rows.Next() {
		var id, tableName, action, actorEmail string
		var recordID *string
		var actorID *string
		var oldData, newData []byte
		var changedAt time.Time
		if err := rows.Scan(&id, &tableName, &recordID, &action, &actorID, &actorEmail, &oldData, &newData, &changedAt); err != nil {
			return response.Error(500, err.Error()), nil
		}
		item := map[string]interface{}{
			"id":         id,
			"table":      tableName,
			"recordId":   "",
			"action":     action,
			"actorId":    "",
			"actorEmail": actorEmail,
			"changedAt":  changedAt,
		}
		if recordID != nil {
			item["recordId"] = *recordID
		}
		if actorID != nil {
			item["actorId"] = *actorID
		}
		if len(oldData) > 0 {
			var parsed interface{}
			_ = json.Unmarshal(oldData, &parsed)
			item["oldData"] = parsed
		}
		if len(newData) > 0 {
			var parsed interface{}
			_ = json.Unmarshal(newData, &parsed)
			item["newData"] = parsed
		}
		items = append(items, item)
	}

	var tables []string
	trows, err := pool.Query(ctx, `SELECT DISTINCT table_name FROM audit_log ORDER BY 1`)
	if err == nil {
		defer trows.Close()
		for trows.Next() {
			var name string
			if err := trows.Scan(&name); err == nil {
				tables = append(tables, name)
			}
		}
	}

	pages := total / pageSize
	if total%pageSize != 0 {
		pages++
	}

	return response.JSON(200, map[string]interface{}{
		"items":    items,
		"total":    total,
		"page":     page,
		"pageSize": pageSize,
		"pages":    pages,
		"tables":   tables,
	}), nil
}
