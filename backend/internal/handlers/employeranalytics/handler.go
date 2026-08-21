package employeranalytics

import (
	"context"
	"encoding/csv"
	"strconv"
	"strings"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	claims, err := auth.FromRequest(ctx, req.Headers)
	if err != nil {
		return response.Error(401, "unauthorized"), nil
	}
	if claims.Role != "employer" && claims.Role != "admin" {
		return response.Error(403, "forbidden"), nil
	}

	if strings.HasSuffix(req.Resource, "/export") {
		return exportCSV(ctx, req)
	}
	return getAnalytics(ctx, req)
}

func candidateFilter(req events.APIGatewayProxyRequest, idx *int) (string, []interface{}) {
	q := " WHERE 1=1"
	args := []interface{}{}
	if v := req.QueryStringParameters["vertical"]; v != "" {
		q += " AND vertical ILIKE $" + strconv.Itoa(*idx)
		args = append(args, v)
		*idx++
	}
	return q, args
}

func enrollmentFilter(req events.APIGatewayProxyRequest, idx *int) (string, []interface{}) {
	q := " WHERE 1=1"
	args := []interface{}{}
	if v := req.QueryStringParameters["vertical"]; v != "" {
		q += " AND c.vertical ILIKE $" + strconv.Itoa(*idx)
		args = append(args, v)
		*idx++
	}
	if v := req.QueryStringParameters["level"]; v != "" {
		q += " AND c.level ILIKE $" + strconv.Itoa(*idx)
		args = append(args, v)
		*idx++
	}
	if v := req.QueryStringParameters["from"]; v != "" {
		q += " AND e.enrolled_at >= $" + strconv.Itoa(*idx)
		args = append(args, v)
		*idx++
	}
	if v := req.QueryStringParameters["to"]; v != "" {
		q += " AND e.enrolled_at <= $" + strconv.Itoa(*idx)
		args = append(args, v)
		*idx++
	}
	return q, args
}

func getAnalytics(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	idx := 1
	candFilter, candArgs := candidateFilter(req, &idx)
	idx = 1
	enrFilter, enrArgs := enrollmentFilter(req, &idx)

	summary := map[string]interface{}{}
	var totalCandidates, availableCandidates int
	pool.QueryRow(ctx, `SELECT count(*) FROM candidates`+candFilter, candArgs...).Scan(&totalCandidates)
	pool.QueryRow(ctx, `SELECT count(*) FROM candidates`+candFilter+` AND billing_rate > 0`, candArgs...).Scan(&availableCandidates)

	var totalEnrollments, completedEnrollments int
	var avgProgress float64
	pool.QueryRow(ctx, `SELECT count(*), coalesce(avg(e.progress),0) FROM enrollments e JOIN courses c ON c.id = e.course_id`+enrFilter, enrArgs...).Scan(&totalEnrollments, &avgProgress)
	pool.QueryRow(ctx, `SELECT count(*) FROM enrollments e JOIN courses c ON c.id = e.course_id`+enrFilter+` AND e.progress >= 100`, enrArgs...).Scan(&completedEnrollments)

	completionRate := 0.0
	if totalEnrollments > 0 {
		completionRate = float64(completedEnrollments) / float64(totalEnrollments) * 100
	}

	summary["totalCandidates"] = totalCandidates
	summary["availableCandidates"] = availableCandidates
	summary["totalEnrollments"] = totalEnrollments
	summary["completedEnrollments"] = completedEnrollments
	summary["completionRate"] = completionRate
	summary["avgProgress"] = avgProgress

	candidatesByVertical := []map[string]interface{}{}
	rows, err := pool.Query(ctx, `SELECT vertical, count(*), coalesce(avg(rating)*20,0) FROM candidates`+candFilter+` GROUP BY vertical ORDER BY vertical`, candArgs...)
	if err == nil {
		for rows.Next() {
			var label string
			var count int
			var avgMatch float64
			rows.Scan(&label, &count, &avgMatch)
			candidatesByVertical = append(candidatesByVertical, map[string]interface{}{"label": label, "candidates": count, "avgMatch": avgMatch})
		}
		rows.Close()
	}

	candidatesByAvailability := []map[string]interface{}{
		{"label": "Available", "count": availableCandidates},
		{"label": "Unavailable", "count": totalCandidates - availableCandidates},
	}

	completionByCourse := []map[string]interface{}{}
	rows, err = pool.Query(ctx, `SELECT c.title, count(e.id), count(e.id) FILTER (WHERE e.progress >= 100), coalesce(avg(e.progress),0)
		FROM enrollments e JOIN courses c ON c.id = e.course_id`+enrFilter+` GROUP BY c.title ORDER BY c.title`, enrArgs...)
	if err == nil {
		for rows.Next() {
			var label string
			var enrollmentsCount, completed int
			var avgProg float64
			rows.Scan(&label, &enrollmentsCount, &completed, &avgProg)
			rate := 0.0
			if enrollmentsCount > 0 {
				rate = float64(completed) / float64(enrollmentsCount) * 100
			}
			completionByCourse = append(completionByCourse, map[string]interface{}{
				"label": label, "enrollments": enrollmentsCount, "completed": completed, "completionRate": rate, "avgProgress": avgProg,
			})
		}
		rows.Close()
	}

	enrollmentTrend := []map[string]interface{}{}
	rows, err = pool.Query(ctx, `SELECT to_char(e.enrolled_at, 'YYYY-MM') AS period, count(*), count(*) FILTER (WHERE e.progress >= 100)
		FROM enrollments e JOIN courses c ON c.id = e.course_id`+enrFilter+` GROUP BY period ORDER BY period`, enrArgs...)
	if err == nil {
		for rows.Next() {
			var period string
			var enrollmentsCount, completions int
			rows.Scan(&period, &enrollmentsCount, &completions)
			enrollmentTrend = append(enrollmentTrend, map[string]interface{}{"period": period, "enrollments": enrollmentsCount, "completions": completions})
		}
		rows.Close()
	}

	topSkills := []map[string]interface{}{}
	rows, err = pool.Query(ctx, `SELECT unnest(skills) AS skill, count(*) FROM candidates`+candFilter+` GROUP BY skill ORDER BY count(*) DESC LIMIT 10`, candArgs...)
	if err == nil {
		for rows.Next() {
			var label string
			var count int
			rows.Scan(&label, &count)
			topSkills = append(topSkills, map[string]interface{}{"label": label, "count": count})
		}
		rows.Close()
	}

	return response.JSON(200, map[string]interface{}{
		"summary":                  summary,
		"candidatesByVertical":     candidatesByVertical,
		"candidatesByAvailability": candidatesByAvailability,
		"completionByCourse":       completionByCourse,
		"enrollmentTrend":          enrollmentTrend,
		"topSkills":                topSkills,
	}), nil
}

func exportCSV(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	dataset := req.QueryStringParameters["dataset"]
	if dataset == "" {
		dataset = "candidates"
	}

	var sb strings.Builder
	w := csv.NewWriter(&sb)

	idx := 1
	if dataset == "completions" {
		enrFilter, enrArgs := enrollmentFilter(req, &idx)
		w.Write([]string{"course", "vertical", "level", "enrollments", "completed", "completionRate", "avgProgress"})
		rows, err := pool.Query(ctx, `SELECT c.title, c.vertical, c.level, count(e.id), count(e.id) FILTER (WHERE e.progress >= 100), coalesce(avg(e.progress),0)
			FROM enrollments e JOIN courses c ON c.id = e.course_id`+enrFilter+` GROUP BY c.title, c.vertical, c.level ORDER BY c.title`, enrArgs...)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		defer rows.Close()
		for rows.Next() {
			var title, vertical, level string
			var enrollments, completed int
			var avgProgress float64
			if err := rows.Scan(&title, &vertical, &level, &enrollments, &completed, &avgProgress); err != nil {
				return response.Error(500, err.Error()), nil
			}
			rate := 0.0
			if enrollments > 0 {
				rate = float64(completed) / float64(enrollments) * 100
			}
			w.Write([]string{title, vertical, level, strconv.Itoa(enrollments), strconv.Itoa(completed), strconv.FormatFloat(rate, 'f', 1, 64), strconv.FormatFloat(avgProgress, 'f', 1, 64)})
		}
	} else {
		candFilter, candArgs := candidateFilter(req, &idx)
		w.Write([]string{"name", "title", "vertical", "location", "billingRate", "rating", "experience"})
		rows, err := pool.Query(ctx, `SELECT name, title, vertical, location, billing_rate, rating, experience FROM candidates`+candFilter+` ORDER BY name`, candArgs...)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		defer rows.Close()
		for rows.Next() {
			var name, title, vertical, location, experience string
			var billingRate int
			var rating float64
			if err := rows.Scan(&name, &title, &vertical, &location, &billingRate, &rating, &experience); err != nil {
				return response.Error(500, err.Error()), nil
			}
			w.Write([]string{name, title, vertical, location, strconv.Itoa(billingRate), strconv.FormatFloat(rating, 'f', 1, 64), experience})
		}
	}
	w.Flush()

	return events.APIGatewayProxyResponse{
		StatusCode: 200,
		Headers: map[string]string{
			"Content-Type":                "text/csv",
			"Content-Disposition":         "attachment; filename=\"" + dataset + "-export.csv\"",
			"Access-Control-Allow-Origin": "*",
		},
		Body: sb.String(),
	}, nil
}
