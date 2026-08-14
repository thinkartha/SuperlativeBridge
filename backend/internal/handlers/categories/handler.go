package categories

import (
	"context"
	"encoding/json"

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
			return getCategory(ctx, id)
		}
		return listCategories(ctx)
	case "POST":
		return createCategory(ctx, req)
	case "PUT":
		return updateCategory(ctx, req)
	case "DELETE":
		return deleteCategory(ctx, req)
	default:
		return response.Error(405, "method not allowed"), nil
	}
}

func scanCategory(row pgx.Row) (models.Category, error) {
	var c models.Category
	err := row.Scan(&c.ID, &c.Name, &c.Slug, &c.Icon, &c.Color, &c.CourseCount, &c.Status)
	return c, err
}

func listCategories(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT id, name, slug, icon, color, course_count, status FROM categories ORDER BY name`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	categories := []models.Category{}
	for rows.Next() {
		c, err := scanCategory(rows)
		if err != nil {
			return response.Error(500, err.Error()), nil
		}
		categories = append(categories, c)
	}
	return response.JSON(200, categories), nil
}

func getCategory(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	c, err := scanCategory(pool.QueryRow(ctx, `SELECT id, name, slug, icon, color, course_count, status FROM categories WHERE id = $1`, id))
	if err == pgx.ErrNoRows {
		return response.Error(404, "category not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, c), nil
}

func createCategory(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	var c models.Category
	if err := json.Unmarshal([]byte(req.Body), &c); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	if c.Status == "" {
		c.Status = "Active"
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	err = pool.QueryRow(ctx, `INSERT INTO categories (name, slug, icon, color, course_count, status) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
		c.Name, c.Slug, c.Icon, c.Color, c.CourseCount, c.Status).Scan(&c.ID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(201, c), nil
}

func updateCategory(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	var c models.Category
	if err := json.Unmarshal([]byte(req.Body), &c); err != nil {
		return response.Error(400, "invalid body"), nil
	}
	c.ID = id
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `UPDATE categories SET name=$1, slug=$2, icon=$3, color=$4, course_count=$5, status=$6 WHERE id=$7`,
		c.Name, c.Slug, c.Icon, c.Color, c.CourseCount, c.Status, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, c), nil
}

func deleteCategory(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_, err = pool.Exec(ctx, `DELETE FROM categories WHERE id=$1`, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(204, nil), nil
}
