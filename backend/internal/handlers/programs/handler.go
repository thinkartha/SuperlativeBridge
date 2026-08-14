package programs

import (
	"context"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/models"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if id, ok := req.PathParameters["id"]; ok && id != "" {
		return getProgram(ctx, id)
	}
	return listPrograms(ctx, req)
}

func scanProgram(row pgx.Row) (models.Program, error) {
	var p models.Program
	err := row.Scan(&p.ID, &p.Title, &p.Agency, &p.Description, &p.ProgramType, &p.Eligibility, &p.Funding, &p.Deadline, &p.Verticals)
	return p, err
}

func listPrograms(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	query := `SELECT id, title, agency, description, program_type, eligibility, funding, deadline, verticals FROM programs WHERE 1=1`
	args := []interface{}{}
	if v := req.QueryStringParameters["type"]; v != "" {
		query += " AND program_type = $1"
		args = append(args, v)
	}
	query += " ORDER BY title"
	rows, err := pool.Query(ctx, query, args...)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	programs := []models.Program{}
	for rows.Next() {
		p, err := scanProgram(rows)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		programs = append(programs, p)
	}
	return response.JSON(200, programs), nil
}

func getProgram(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	p, err := scanProgram(pool.QueryRow(ctx, `SELECT id, title, agency, description, program_type, eligibility, funding, deadline, verticals FROM programs WHERE id = $1`, id))
	if err == pgx.ErrNoRows {
		return response.Error(404, "program not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, p), nil
}
