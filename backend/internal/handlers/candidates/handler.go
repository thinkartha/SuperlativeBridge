package candidates

import (
	"context"
	"strconv"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if id, ok := req.PathParameters["id"]; ok && id != "" {
		return getCandidate(ctx, id)
	}
	return listCandidates(ctx, req)
}

func scanCandidate(row pgx.Row) (models.Candidate, error) {
	var c models.Candidate
	var userID *string
	err := row.Scan(
		&c.ID, &userID, &c.Name, &c.Title, &c.Skills, &c.Location, &c.Zip, &c.BillingRate,
		&c.Vertical, &c.Education, &c.Programs, &c.Rating, &c.Experience, &c.Bio, &c.Email,
		&c.Availability, &c.OpenToRelocate, &c.Phone,
		&c.VisaStatus, &c.Lat, &c.Lng, &c.ResumeURL, &c.ResumeText,
	)
	if userID != nil {
		c.UserID = *userID
	}
	return c, err
}

const candidateCols = `id, user_id, name, title, skills, location, zip, billing_rate, vertical, education, programs, rating, experience, bio, email,
		COALESCE(availability,'open'), COALESCE(open_to_relocate,false), COALESCE(phone,''),
		COALESCE(visa_status,'Work Authorization'), lat, lng, COALESCE(resume_url,''), COALESCE(resume_text,'')`

func listCandidates(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	q := req.QueryStringParameters
	query := `SELECT ` + candidateCols + ` FROM candidates WHERE 1=1`
	args := []interface{}{}
	idx := 1

	add := func(clause string, val interface{}) {
		query += " AND " + clause
		args = append(args, val)
		idx++
	}

	if v := q["search"]; v != "" {
		add("(name ILIKE $"+strconv.Itoa(idx)+" OR title ILIKE $"+strconv.Itoa(idx)+" OR location ILIKE $"+strconv.Itoa(idx)+" OR email ILIKE $"+strconv.Itoa(idx)+")", "%"+v+"%")
	}
	if v := q["skill"]; v != "" {
		add("$"+strconv.Itoa(idx)+" = ANY(skills)", v)
	}
	if v := q["vertical"]; v != "" {
		add("vertical ILIKE $"+strconv.Itoa(idx), v)
	}
	if v := q["location"]; v != "" {
		add("location ILIKE $"+strconv.Itoa(idx), "%"+v+"%")
	}
	if v := q["education"]; v != "" {
		add("education ILIKE $"+strconv.Itoa(idx), "%"+v+"%")
	}
	if v := q["experience"]; v != "" {
		add("experience ILIKE $"+strconv.Itoa(idx), "%"+v+"%")
	}
	if v := q["availability"]; v != "" && v != "all" {
		add("COALESCE(availability,'open') = $"+strconv.Itoa(idx), v)
	}
	if v := q["program"]; v != "" {
		add("$"+strconv.Itoa(idx)+" = ANY(programs)", v)
	}
	if v := q["visa"]; v != "" && v != "all" {
		add("COALESCE(visa_status,'Work Authorization') ILIKE $"+strconv.Itoa(idx), v)
	}
	if v := q["minRating"]; v != "" {
		if f, err := strconv.ParseFloat(v, 64); err == nil {
			add("rating >= $"+strconv.Itoa(idx), f)
		}
	}
	if v := q["maxRate"]; v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			add("billing_rate <= $"+strconv.Itoa(idx), n)
		}
	}
	if v := q["minRate"]; v != "" {
		if n, err := strconv.Atoi(v); err == nil {
			add("billing_rate >= $"+strconv.Itoa(idx), n)
		}
	}
	if q["openToRelocate"] == "true" {
		query += " AND COALESCE(open_to_relocate,false) = true"
	}

	sort := q["sort"]
	switch sort {
	case "rating":
		query += " ORDER BY rating DESC, name"
	case "rate":
		query += " ORDER BY billing_rate ASC, name"
	case "experience":
		query += " ORDER BY experience DESC, name"
	default:
		query += " ORDER BY name"
	}

	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	candidates := []models.Candidate{}
	for rows.Next() {
		c, err := scanCandidate(rows)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		candidates = append(candidates, c)
	}
	return response.JSON(200, candidates), nil
}

func getCandidate(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	c, err := scanCandidate(pool.QueryRow(ctx, `SELECT `+candidateCols+` FROM candidates WHERE id = $1`, id))
	if err == pgx.ErrNoRows {
		return response.Error(404, "candidate not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, c), nil
}
