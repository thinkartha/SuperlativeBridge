package visa

import (
	"context"

	"github.com/aws/aws-lambda-go/events"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	query := `SELECT id, title, visa_type, category, description, eligibility, duration, industry_match FROM visa_programs WHERE 1=1`
	args := []interface{}{}
	if v := req.QueryStringParameters["type"]; v != "" {
		query += " AND visa_type = $1"
		args = append(args, v)
	}
	query += " ORDER BY title"
	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	visas := []models.VisaProgram{}
	for rows.Next() {
		var v models.VisaProgram
		if err := rows.Scan(&v.ID, &v.Title, &v.VisaType, &v.Category, &v.Description, &v.Eligibility, &v.Duration, &v.IndustryMatch); err != nil {
			return response.Error(500, err.Error()), nil
		}
		visas = append(visas, v)
	}
	return response.JSON(200, visas), nil
}
