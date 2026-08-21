package integrations

import (
	"context"
	"encoding/json"
	"strings"
	"time"

	"github.com/aws/aws-lambda-go/events"
	"github.com/jackc/pgx/v5"

	"github.com/superlativebridge/backend/internal/auth"
	"github.com/superlativebridge/backend/internal/db"
	"github.com/superlativebridge/backend/internal/response"
)

func Handler(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	if strings.Contains(req.Resource, "/run") && req.HTTPMethod == "POST" {
		if _, err := auth.FromRequest(ctx, req.Headers); err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		return runPipeline(ctx, req)
	}
	if strings.Contains(req.Resource, "/pipelines/") && req.HTTPMethod == "PUT" {
		if _, err := auth.FromRequest(ctx, req.Headers); err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		return updatePipelineSettings(ctx, req)
	}
	if req.HTTPMethod == "PUT" {
		if _, err := auth.FromRequest(ctx, req.Headers); err != nil {
			return response.Error(401, "unauthorized"), nil
		}
		if id, ok := req.PathParameters["id"]; ok && id != "" {
			return updateIntegrationSettings(ctx, req, id)
		}
	}
	if req.HTTPMethod == "GET" {
		if id, ok := req.PathParameters["id"]; ok && id != "" {
			return getIntegration(ctx, id)
		}
		return listIntegrations(ctx)
	}
	return response.Error(405, "method not allowed"), nil
}

type dagNode struct {
	ID        string   `json:"id"`
	Name      string   `json:"name"`
	Type      string   `json:"type"`
	DependsOn []string `json:"dependsOn"`
}

type runStep struct {
	NodeID     string `json:"nodeId"`
	Name       string `json:"name"`
	Status     string `json:"status"`
	DurationMs int    `json:"durationMs"`
	Log        string `json:"log"`
}

type pipelineRun struct {
	ID         string                 `json:"id"`
	PipelineID string                 `json:"pipelineId"`
	RunNumber  int                    `json:"runNumber"`
	Status     string                 `json:"status"`
	Trigger    string                 `json:"trigger"`
	StartedAt  time.Time              `json:"startedAt"`
	FinishedAt *time.Time             `json:"finishedAt,omitempty"`
	Steps      []runStep              `json:"steps"`
	Outputs    map[string]interface{} `json:"outputs"`
	Metrics    map[string]interface{} `json:"metrics"`
}

type pipeline struct {
	ID            string                 `json:"id"`
	IntegrationID string                 `json:"integrationId"`
	Name          string                 `json:"name"`
	Kind          string                 `json:"kind"`
	Schedule      string                 `json:"schedule"`
	Status        string                 `json:"status"`
	Description   string                 `json:"description"`
	DAG           []dagNode              `json:"dag"`
	Settings      map[string]interface{} `json:"settings"`
	RecentRuns    []pipelineRun          `json:"recentRuns"`
}

type integration struct {
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Slug        string                 `json:"slug"`
	Category    string                 `json:"category"`
	Status      string                 `json:"status"`
	Description string                 `json:"description"`
	Logo        string                 `json:"logo"`
	Config      map[string]interface{} `json:"config"`
	LastSyncAt  *time.Time             `json:"lastSyncAt,omitempty"`
	Pipelines   []pipeline             `json:"pipelines"`
}

type observability struct {
	TotalPipelines   int            `json:"totalPipelines"`
	RunningJobs      int            `json:"runningJobs"`
	FailedLast24h    int            `json:"failedLast24h"`
	SuccessLast24h   int            `json:"successLast24h"`
	AvgDurationMs    float64        `json:"avgDurationMs"`
	TotalRunsLast24h int            `json:"totalRunsLast24h"`
	ByStatus         map[string]int `json:"byStatus"`
	ByIntegration    []obsRow       `json:"byIntegration"`
}

type obsRow struct {
	IntegrationID  string     `json:"integrationId"`
	Name           string     `json:"name"`
	Pipelines      int        `json:"pipelines"`
	RunsLast24h    int        `json:"runsLast24h"`
	FailedLast24h  int        `json:"failedLast24h"`
	SuccessRate24h float64    `json:"successRate24h"`
	LastRunStatus  string     `json:"lastRunStatus"`
	LastRunAt      *time.Time `json:"lastRunAt,omitempty"`
}

func listIntegrations(ctx context.Context) (events.APIGatewayProxyResponse, error) {
	items, err := loadIntegrations(ctx, "")
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	obs, err := loadObservability(ctx, items)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	return response.JSON(200, map[string]interface{}{
		"integrations":  items,
		"observability": obs,
	}), nil
}

func getIntegration(ctx context.Context, id string) (events.APIGatewayProxyResponse, error) {
	items, err := loadIntegrations(ctx, id)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if len(items) == 0 {
		return response.Error(404, "integration not found"), nil
	}
	return response.JSON(200, items[0]), nil
}

func loadIntegrations(ctx context.Context, onlyID string) ([]integration, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return nil, err
	}

	q := `SELECT id, name, slug, category, status, description, logo, config, last_sync_at FROM integrations`
	args := []interface{}{}
	if onlyID != "" {
		q += ` WHERE id = $1 OR slug = $1`
		args = append(args, onlyID)
	}
	q += ` ORDER BY name`

	rows, err := pool.Query(ctx, q, args...)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []integration{}
	for rows.Next() {
		var it integration
		var cfg []byte
		var last *time.Time
		if err := rows.Scan(&it.ID, &it.Name, &it.Slug, &it.Category, &it.Status, &it.Description, &it.Logo, &cfg, &last); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(cfg, &it.Config)
		if it.Config == nil {
			it.Config = map[string]interface{}{}
		}
		it.LastSyncAt = last
		it.Pipelines = []pipeline{}
		out = append(out, it)
	}

	for i := range out {
		pipes, err := loadPipelines(ctx, out[i].ID)
		if err != nil {
			return nil, err
		}
		out[i].Pipelines = pipes
	}
	return out, nil
}

func loadPipelines(ctx context.Context, integrationID string) ([]pipeline, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := pool.Query(ctx, `SELECT id, integration_id, name, kind, schedule, status, description, dag, COALESCE(settings, '{}'::jsonb)
		FROM integration_pipelines WHERE integration_id = $1 ORDER BY name`, integrationID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	pipes := []pipeline{}
	for rows.Next() {
		var p pipeline
		var dagRaw, settingsRaw []byte
		if err := rows.Scan(&p.ID, &p.IntegrationID, &p.Name, &p.Kind, &p.Schedule, &p.Status, &p.Description, &dagRaw, &settingsRaw); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(dagRaw, &p.DAG)
		if p.DAG == nil {
			p.DAG = []dagNode{}
		}
		_ = json.Unmarshal(settingsRaw, &p.Settings)
		if p.Settings == nil {
			p.Settings = map[string]interface{}{}
		}
		p.RecentRuns = []pipelineRun{}
		pipes = append(pipes, p)
	}
	for i := range pipes {
		runs, err := loadRuns(ctx, pipes[i].ID, 10)
		if err != nil {
			return nil, err
		}
		pipes[i].RecentRuns = runs
	}
	return pipes, nil
}

func loadRuns(ctx context.Context, pipelineID string, limit int) ([]pipelineRun, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return nil, err
	}
	rows, err := pool.Query(ctx, `SELECT id, pipeline_id, run_number, status, trigger, started_at, finished_at, steps,
		COALESCE(outputs, '{}'::jsonb), COALESCE(metrics, '{}'::jsonb)
		FROM pipeline_runs WHERE pipeline_id = $1 ORDER BY started_at DESC LIMIT $2`, pipelineID, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	runs := []pipelineRun{}
	for rows.Next() {
		var r pipelineRun
		var stepsRaw, outRaw, metRaw []byte
		if err := rows.Scan(&r.ID, &r.PipelineID, &r.RunNumber, &r.Status, &r.Trigger, &r.StartedAt, &r.FinishedAt, &stepsRaw, &outRaw, &metRaw); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(stepsRaw, &r.Steps)
		if r.Steps == nil {
			r.Steps = []runStep{}
		}
		_ = json.Unmarshal(outRaw, &r.Outputs)
		if r.Outputs == nil {
			r.Outputs = map[string]interface{}{}
		}
		_ = json.Unmarshal(metRaw, &r.Metrics)
		if r.Metrics == nil {
			r.Metrics = map[string]interface{}{}
		}
		runs = append(runs, r)
	}
	return runs, nil
}

func loadObservability(ctx context.Context, items []integration) (observability, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return observability{}, err
	}
	obs := observability{
		ByStatus:      map[string]int{},
		ByIntegration: []obsRow{},
	}
	for _, it := range items {
		obs.TotalPipelines += len(it.Pipelines)
		for _, p := range it.Pipelines {
			obs.ByStatus[p.Status]++
			if p.Status == "running" {
				obs.RunningJobs++
			}
		}
	}

	var failed, success, total int
	var avg *float64
	err = pool.QueryRow(ctx, `
		SELECT
		  COUNT(*) FILTER (WHERE status = 'failed'),
		  COUNT(*) FILTER (WHERE status = 'success'),
		  COUNT(*),
		  AVG(EXTRACT(EPOCH FROM (finished_at - started_at)) * 1000) FILTER (WHERE finished_at IS NOT NULL)
		FROM pipeline_runs
		WHERE started_at >= now() - interval '24 hours'`).Scan(&failed, &success, &total, &avg)
	if err != nil {
		return observability{}, err
	}
	obs.FailedLast24h = failed
	obs.SuccessLast24h = success
	obs.TotalRunsLast24h = total
	if avg != nil {
		obs.AvgDurationMs = *avg
	}

	for _, it := range items {
		row := obsRow{
			IntegrationID: it.ID,
			Name:          it.Name,
			Pipelines:     len(it.Pipelines),
		}
		_ = pool.QueryRow(ctx, `
			SELECT
			  COUNT(*) FILTER (WHERE r.started_at >= now() - interval '24 hours'),
			  COUNT(*) FILTER (WHERE r.started_at >= now() - interval '24 hours' AND r.status = 'failed'),
			  (SELECT r2.status FROM pipeline_runs r2
			     JOIN integration_pipelines p2 ON p2.id = r2.pipeline_id
			    WHERE p2.integration_id = $1
			    ORDER BY r2.started_at DESC LIMIT 1),
			  (SELECT r2.started_at FROM pipeline_runs r2
			     JOIN integration_pipelines p2 ON p2.id = r2.pipeline_id
			    WHERE p2.integration_id = $1
			    ORDER BY r2.started_at DESC LIMIT 1)
			FROM integration_pipelines p
			LEFT JOIN pipeline_runs r ON r.pipeline_id = p.id
			WHERE p.integration_id = $1`, it.ID).Scan(&row.RunsLast24h, &row.FailedLast24h, &row.LastRunStatus, &row.LastRunAt)
		ok := row.RunsLast24h - row.FailedLast24h
		if row.RunsLast24h > 0 {
			row.SuccessRate24h = float64(ok) / float64(row.RunsLast24h)
		}
		obs.ByIntegration = append(obs.ByIntegration, row)
	}
	return obs, nil
}

func updateIntegrationSettings(ctx context.Context, req events.APIGatewayProxyRequest, id string) (events.APIGatewayProxyResponse, error) {
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var body struct {
		Config      map[string]interface{} `json:"config"`
		Status      *string                `json:"status"`
		Description *string                `json:"description"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid json"), nil
	}
	cfg, _ := json.Marshal(body.Config)
	if body.Config == nil {
		cfg = nil
	}
	tag, err := pool.Exec(ctx, `
		UPDATE integrations SET
		  config = COALESCE($2::jsonb, config),
		  status = COALESCE($3, status),
		  description = COALESCE($4, description),
		  updated_at = now()
		WHERE id = $1 OR slug = $1`, id, cfg, body.Status, body.Description)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	if tag.RowsAffected() == 0 {
		return response.Error(404, "integration not found"), nil
	}
	return getIntegration(ctx, id)
}

func updatePipelineSettings(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	if id == "" {
		return response.Error(400, "missing pipeline id"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var body struct {
		Settings    map[string]interface{} `json:"settings"`
		Schedule    *string                `json:"schedule"`
		Description *string                `json:"description"`
		Status      *string                `json:"status"`
	}
	if err := json.Unmarshal([]byte(req.Body), &body); err != nil {
		return response.Error(400, "invalid json"), nil
	}
	settingsJSON, _ := json.Marshal(body.Settings)
	if body.Settings == nil {
		settingsJSON = nil
	}
	var integrationID string
	var name, kind, schedule, status, description string
	var dagRaw, settingsRaw []byte
	err = pool.QueryRow(ctx, `
		UPDATE integration_pipelines SET
		  settings = COALESCE($2::jsonb, settings),
		  schedule = COALESCE($3, schedule),
		  description = COALESCE($4, description),
		  status = COALESCE($5, status),
		  updated_at = now()
		WHERE id = $1
		RETURNING id, integration_id, name, kind, schedule, status, description, dag, COALESCE(settings, '{}'::jsonb)`,
		id, settingsJSON, body.Schedule, body.Description, body.Status).
		Scan(&id, &integrationID, &name, &kind, &schedule, &status, &description, &dagRaw, &settingsRaw)
	if err == pgx.ErrNoRows {
		return response.Error(404, "pipeline not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	p := pipeline{
		ID: id, IntegrationID: integrationID, Name: name, Kind: kind,
		Schedule: schedule, Status: status, Description: description,
	}
	_ = json.Unmarshal(dagRaw, &p.DAG)
	_ = json.Unmarshal(settingsRaw, &p.Settings)
	if p.DAG == nil {
		p.DAG = []dagNode{}
	}
	if p.Settings == nil {
		p.Settings = map[string]interface{}{}
	}
	runs, _ := loadRuns(ctx, id, 10)
	p.RecentRuns = runs
	return response.JSON(200, p), nil
}

func runPipeline(ctx context.Context, req events.APIGatewayProxyRequest) (events.APIGatewayProxyResponse, error) {
	id := req.PathParameters["id"]
	if id == "" {
		return response.Error(400, "missing pipeline id"), nil
	}
	pool, err := db.Pool(ctx)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}

	var dagRaw []byte
	var name string
	err = pool.QueryRow(ctx, `SELECT name, dag FROM integration_pipelines WHERE id = $1`, id).Scan(&name, &dagRaw)
	if err == pgx.ErrNoRows {
		return response.Error(404, "pipeline not found"), nil
	}
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	var nodes []dagNode
	_ = json.Unmarshal(dagRaw, &nodes)

	steps := make([]runStep, 0, len(nodes))
	for _, n := range nodes {
		steps = append(steps, runStep{
			NodeID:     n.ID,
			Name:       n.Name,
			Status:     "success",
			DurationMs: 400 + len(n.Name)*12,
			Log:        "Manual run completed for " + n.Name,
		})
	}
	stepsJSON, _ := json.Marshal(steps)
	outputs := map[string]interface{}{
		"trigger":     "manual",
		"pipeline":    name,
		"nodesRun":    len(nodes),
		"artifactUri": "s3://sb-demo-artifacts/manual/" + id + "/latest.json",
		"message":     "Demo manual run finished successfully",
	}
	metrics := map[string]interface{}{
		"durationMs":  8000,
		"successRate": 1.0,
		"apiCalls":    len(nodes),
		"errorCount":  0,
	}
	outJSON, _ := json.Marshal(outputs)
	metJSON, _ := json.Marshal(metrics)

	var nextNum int
	_ = pool.QueryRow(ctx, `SELECT COALESCE(MAX(run_number), 0) + 1 FROM pipeline_runs WHERE pipeline_id = $1`, id).Scan(&nextNum)

	now := time.Now()
	fin := now.Add(8 * time.Second)
	var run pipelineRun
	var stepsScan, outScan, metScan []byte
	err = pool.QueryRow(ctx, `INSERT INTO pipeline_runs (pipeline_id, run_number, status, trigger, started_at, finished_at, steps, outputs, metrics)
		VALUES ($1,$2,'success','manual',$3,$4,$5,$6,$7)
		RETURNING id, pipeline_id, run_number, status, trigger, started_at, finished_at, steps, COALESCE(outputs,'{}'::jsonb), COALESCE(metrics,'{}'::jsonb)`,
		id, nextNum, now, fin, stepsJSON, outJSON, metJSON).
		Scan(&run.ID, &run.PipelineID, &run.RunNumber, &run.Status, &run.Trigger, &run.StartedAt, &run.FinishedAt, &stepsScan, &outScan, &metScan)
	if err != nil {
		return response.Error(500, err.Error()), nil
	}
	_ = json.Unmarshal(stepsScan, &run.Steps)
	_ = json.Unmarshal(outScan, &run.Outputs)
	_ = json.Unmarshal(metScan, &run.Metrics)
	_, _ = pool.Exec(ctx, `UPDATE integration_pipelines SET status = 'success' WHERE id = $1`, id)
	_, _ = pool.Exec(ctx, `UPDATE integrations SET last_sync_at = now() WHERE id = (SELECT integration_id FROM integration_pipelines WHERE id = $1)`, id)

	return response.JSON(201, run), nil
}
