package lms

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/middleware"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	key := header(req.Headers, "X-Api-Key")
	if key == "" {
		key = header(req.Headers, "Authorization")
	}
	if !middleware.AllowRate("lms:" + key) {
		return response.Error(429, "rate limit exceeded"), nil
	}

	res := req.Resource
	switch {
	case strings.HasSuffix(res, "/providers") && req.HTTPMethod == "GET":
		return listProviders(ctx)
	case strings.Contains(res, "/webhooks/") && req.HTTPMethod == "POST":
		return handleWebhook(ctx, req)
	case strings.HasSuffix(res, "/import") && req.HTTPMethod == "POST":
		return importCourses(ctx, req)
	case strings.HasSuffix(res, "/sync") && req.HTTPMethod == "POST":
		return syncProvider(ctx, req)
	case strings.Contains(res, "/jobs") && req.HTTPMethod == "GET":
		return listJobs(ctx, req)
	default:
		return response.Error(404, "not found"), nil
	}
}

func header(h map[string]string, name string) string {
	for k, v := range h {
		if strings.EqualFold(k, name) {
			return v
		}
	}
	return ""
}

type provider struct {
	ID          string                 `json:"id"`
	Slug        string                 `json:"slug"`
	Name        string                 `json:"name"`
	Kind        string                 `json:"kind"`
	Status      string                 `json:"status"`
	BaseURL     string                 `json:"baseUrl"`
	Config      map[string]interface{} `json:"config"`
	LastSyncAt  *time.Time             `json:"lastSyncAt,omitempty"`
	Description string                 `json:"description"`
}

type importCourse struct {
	ExternalID  string         `json:"externalId"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	Category    string         `json:"category"`
	Vertical    string         `json:"vertical"`
	Language    string         `json:"language"`
	Level       string         `json:"level"`
	Duration    string         `json:"duration"`
	Instructor  string         `json:"instructor"`
	Image       string         `json:"image"`
	Modules     []importModule `json:"modules"`
}

type importModule struct {
	Title    string `json:"title"`
	Order    int    `json:"order"`
	VideoURL string `json:"videoUrl"`
	Duration string `json:"duration"`
	Content  string `json:"content"`
}

func listProviders(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT id, slug, name, kind, status, COALESCE(base_url,''), config, last_sync_at, COALESCE(description,'')
		FROM lms_providers ORDER BY name`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	out := []provider{}
	for rows.Next() {
		var p provider
		var cfg []byte
		if err := rows.Scan(&p.ID, &p.Slug, &p.Name, &p.Kind, &p.Status, &p.BaseURL, &cfg, &p.LastSyncAt, &p.Description); err != nil {
			return response.Error(500, err.Error()), nil
		}
		_ = json.Unmarshal(cfg, &p.Config)
		if p.Config == nil {
			p.Config = map[string]interface{}{}
		}
		out = append(out, p)
	}
	return response.JSON(200, map[string]interface{}{"providers": out}), nil
}

func importCourses(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if res, ok := middleware.RequireIntegrationAPIKey(req.Headers); !ok {
		return res, nil
	}
	var body struct {
		Provider string         `json:"provider"`
		Courses  []importCourse `json:"courses"`
		Upsert   bool           `json:"upsert"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil || body.Provider == "" || len(body.Courses) == 0 {
		return response.Error(400, "provider and courses[] required"), nil
	}

	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var providerID string
	err = pool.QueryRow(ctx, `SELECT id FROM lms_providers WHERE slug = $1 OR id::text = $1`, body.Provider).Scan(&providerID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "lms provider not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var jobID string
	err = pool.QueryRow(ctx, `INSERT INTO lms_sync_jobs (provider_id, job_type, status, request)
		VALUES ($1,'import','running',$2) RETURNING id`, providerID, req.Body).Scan(&jobID)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	imported := 0
	updated := 0
	errors := []string{}

	for _, c := range body.Courses {
		if c.Title == "" || c.ExternalID == "" {
			errors = append(errors, "skip: title and externalId required")
			continue
		}
		if c.Language == "" {
			c.Language = "English"
		}
		if c.Level == "" {
			c.Level = "Beginner"
		}
		if c.Category == "" {
			c.Category = "Imported"
		}
		if c.Vertical == "" {
			c.Vertical = "professional-services"
		}
		status := "Published"

		var existingCourseID *string
		_ = pool.QueryRow(ctx, `SELECT course_id FROM lms_external_courses WHERE provider_id = $1 AND external_id = $2`,
			providerID, c.ExternalID).Scan(&existingCourseID)

		if existingCourseID != nil && body.Upsert {
			_, err = pool.Exec(ctx, `UPDATE courses SET title=$1, description=$2, category=$3, vertical=$4, language=$5,
				level=$6, duration=$7, instructor=$8, image=$9, status=$10 WHERE id=$11`,
				c.Title, c.Description, c.Category, c.Vertical, c.Language, c.Level, c.Duration, c.Instructor, c.Image, status, *existingCourseID)
			if err != nil {
				errors = append(errors, c.ExternalID+": "+err.Error())
				continue
			}
			updated++
		} else if existingCourseID != nil {
			errors = append(errors, c.ExternalID+": already imported (set upsert=true)")
			continue
		} else {
			var courseID string
			err = pool.QueryRow(ctx, `INSERT INTO courses (title, description, category, vertical, language, level, duration, students, rating, instructor, image, status)
				VALUES ($1,$2,$3,$4,$5,$6,$7,0,0,$8,$9,$10) RETURNING id`,
				c.Title, c.Description, c.Category, c.Vertical, c.Language, c.Level, c.Duration, c.Instructor, c.Image, status).Scan(&courseID)
			if err != nil {
				errors = append(errors, c.ExternalID+": "+err.Error())
				continue
			}
			_, err = pool.Exec(ctx, `INSERT INTO lms_external_courses (provider_id, external_id, course_id, payload)
				VALUES ($1,$2,$3,$4)`, providerID, c.ExternalID, courseID, mustJSON(c))
			if err != nil {
				errors = append(errors, c.ExternalID+" link: "+err.Error())
				continue
			}
			for i, m := range c.Modules {
				ord := m.Order
				if ord == 0 {
					ord = i + 1
				}
				_, _ = pool.Exec(ctx, `INSERT INTO modules (course_id, title, "order", video_url, duration, content)
					VALUES ($1,$2,$3,$4,$5,$6)`, courseID, m.Title, ord, m.VideoURL, m.Duration, m.Content)
			}
			imported++
		}
	}

	result := map[string]interface{}{
		"imported": imported,
		"updated":  updated,
		"errors":   errors,
	}
	status := "success"
	if imported+updated == 0 {
		status = "failed"
	} else if len(errors) > 0 {
		status = "partial"
	}
	_, _ = pool.Exec(ctx, `UPDATE lms_sync_jobs SET status=$1, result=$2, finished_at=now() WHERE id=$3`,
		status, mustJSON(result), jobID)
	_, _ = pool.Exec(ctx, `UPDATE lms_providers SET last_sync_at=now() WHERE id=$1`, providerID)

	return response.JSON(200, map[string]interface{}{
		"jobId":    jobID,
		"status":   status,
		"imported": imported,
		"updated":  updated,
		"errors":   errors,
	}), nil
}

func syncProvider(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if _, res, ok := middleware.RequireAdmin(req.Headers); !ok {
		return res, nil
	}
	var body struct {
		Provider string `json:"provider"`
	}
	_ = json.Unmarshal([]byte(req.Body), &body)
	if body.Provider == "" {
		body.Provider = req.PathParameters["provider"]
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var id, slug, kind string
	err = pool.QueryRow(ctx, `SELECT id, slug, kind FROM lms_providers WHERE slug=$1 OR id::text=$1`, body.Provider).
		Scan(&id, &slug, &kind)
	if err == pgx.ErrNoRows {
		return response.Error(404, "provider not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var jobID string
	_ = pool.QueryRow(ctx, `INSERT INTO lms_sync_jobs (provider_id, job_type, status, request)
		VALUES ($1,'sync','success',$2) RETURNING id`, id, mustJSON(map[string]string{"provider": slug, "kind": kind})).Scan(&jobID)
	_, _ = pool.Exec(ctx, `UPDATE lms_providers SET last_sync_at=now() WHERE id=$1`, id)

	// Salesforce / partner sync is recorded as a successful orchestration job;
	// live connector credentials live in Secrets Manager (see integrations pipelines).
	return response.JSON(200, map[string]interface{}{
		"jobId":    jobID,
		"provider": slug,
		"kind":     kind,
		"status":   "success",
		"message":  "Sync job recorded; connector pipelines under /api/integrations perform the outbound work.",
	}), nil
}

func handleWebhook(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if res, ok := middleware.VerifyWebhookSignature(req.Headers, req.Body); !ok {
		return res, nil
	}
	provider := req.PathParameters["provider"]
	if provider == "" {
		parts := strings.Split(req.Resource, "/")
		provider = parts[len(parts)-1]
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var providerID string
	err = pool.QueryRow(ctx, `SELECT id FROM lms_providers WHERE slug=$1`, provider).Scan(&providerID)
	if err == pgx.ErrNoRows {
		return response.Error(404, "unknown webhook provider"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var jobID string
	_ = pool.QueryRow(ctx, `INSERT INTO lms_sync_jobs (provider_id, job_type, status, request, result, finished_at)
		VALUES ($1,'webhook','success',$2,$3,now()) RETURNING id`,
		providerID, req.Body, mustJSON(map[string]string{"received": "ok"})).Scan(&jobID)

	// Salesforce opportunity / certification events can fan into integrations pipelines.
	if provider == "salesforce" {
		_, _ = pool.Exec(ctx, `UPDATE integrations SET last_sync_at=now() WHERE slug='salesforce'`)
	}
	return response.JSON(202, map[string]interface{}{"jobId": jobID, "status": "accepted"}), nil
}

func listJobs(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if _, res, ok := middleware.RequireAdmin(req.Headers); !ok {
		return res, nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	rows, err := pool.Query(ctx, `SELECT j.id, p.slug, j.job_type, j.status, j.created_at, j.finished_at
		FROM lms_sync_jobs j JOIN lms_providers p ON p.id = j.provider_id
		ORDER BY j.created_at DESC LIMIT 50`)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	defer rows.Close()
	items := []map[string]interface{}{}
	for rows.Next() {
		var id, slug, jobType, status string
		var created time.Time
		var finished *time.Time
		if rows.Scan(&id, &slug, &jobType, &status, &created, &finished) == nil {
			items = append(items, map[string]interface{}{
				"id": id, "provider": slug, "jobType": jobType, "status": status,
				"createdAt": created, "finishedAt": finished,
			})
		}
	}
	return response.JSON(200, map[string]interface{}{"jobs": items}), nil
}

func mustJSON(v interface{}) []byte {
	b, _ := json.Marshal(v)
	return b
}
