-- More integration DAGs, run outputs, and job observability metrics.

ALTER TABLE pipeline_runs
  ADD COLUMN IF NOT EXISTS outputs JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metrics JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE integration_pipelines
  ADD COLUMN IF NOT EXISTS settings JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_pipeline_runs_status ON pipeline_runs (status, started_at DESC);

-- ─── Extra connectors ──────────────────────────────────────────────────────
INSERT INTO integrations (id, name, slug, category, status, description, logo, config, last_sync_at) VALUES
('d0000001-0000-0000-0000-000000000007', 'HubSpot CRM', 'hubspot', 'CRM', 'connected',
 'Mirrors GIG worker progress and employer interest into HubSpot contacts and deals for partner success teams.',
 'hubspot',
 '{"portalId":"8844221","objects":["contacts","deals","tickets"],"auth":"private_app_token","syncDirection":"bidirectional"}'::jsonb,
 now() - interval '27 minutes'),
('d0000001-0000-0000-0000-000000000008', 'Canvas LMS', 'canvas', 'LMS', 'connected',
 'Imports Canvas course shells and gradebook completions into SuperlativeBridge enrollments.',
 'canvas',
 '{"baseUrl":"https://canvas.instructure.com","accountId":"102","auth":"OAuth2","webhookSecretSet":true}'::jsonb,
 now() - interval '55 minutes'),
('d0000001-0000-0000-0000-000000000009', 'Datadog Observability', 'datadog', 'Observability', 'connected',
 'Ships pipeline job metrics, DAG task latency, and failure traces to Datadog APM + logs.',
 'datadog',
 '{"site":"datadoghq.com","service":"sb-integrations","env":"demo","logIndex":"main"}'::jsonb,
 now() - interval '2 minutes')
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  description = EXCLUDED.description,
  config = EXCLUDED.config,
  last_sync_at = EXCLUDED.last_sync_at;

-- Pipeline settings for existing pipelines
UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 3,
  'retryDelayMinutes', 5,
  'timeoutMinutes', 45,
  'concurrency', 1,
  'alertOnFailure', true,
  'alertChannel', '#workforce-ops',
  'owner', 'integrations-platform',
  'tags', jsonb_build_array('crm', 'batch')
) WHERE id = 'e1000001-0000-0000-0000-000000000001' AND (settings = '{}'::jsonb OR settings IS NULL);

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 2, 'timeoutMinutes', 10, 'concurrency', 4,
  'alertOnFailure', true, 'alertChannel', '#employer-success',
  'owner', 'revenue-ops', 'tags', jsonb_build_array('crm', 'event')
) WHERE id = 'e1000001-0000-0000-0000-000000000002';

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 3, 'timeoutMinutes', 30, 'concurrency', 1,
  'alertOnFailure', true, 'alertChannel', '#workforce-ops',
  'owner', 'people-ops', 'tags', jsonb_build_array('hris', 'enrollment')
) WHERE id = 'e1000001-0000-0000-0000-000000000003';

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 2, 'timeoutMinutes', 60, 'concurrency', 2,
  'alertOnFailure', true, 'alertChannel', '#employer-success',
  'owner', 'talent-ops', 'tags', jsonb_build_array('ats', 'export')
) WHERE id = 'e1000001-0000-0000-0000-000000000004';

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 1, 'timeoutMinutes', 5, 'concurrency', 8,
  'alertOnFailure', false, 'alertChannel', '#workforce-ops',
  'owner', 'platform', 'tags', jsonb_build_array('messaging')
) WHERE id = 'e1000001-0000-0000-0000-000000000005';

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 1, 'timeoutMinutes', 20, 'concurrency', 1,
  'alertOnFailure', true, 'alertChannel', '#billing',
  'owner', 'finance', 'tags', jsonb_build_array('payments'), 'testMode', true
) WHERE id = 'e1000001-0000-0000-0000-000000000006';

UPDATE integration_pipelines SET settings = jsonb_build_object(
  'retries', 5, 'timeoutMinutes', 25, 'concurrency', 3,
  'alertOnFailure', true, 'alertChannel', '#workforce-ops',
  'owner', 'learner-success', 'tags', jsonb_build_array('sms', 'degraded')
) WHERE id = 'e1000001-0000-0000-0000-000000000007';

-- Enrich Salesforce contact DAG with parallel QA + metrics branches
UPDATE integration_pipelines SET dag = $dag$[
  {"id":"extract","name":"Extract LMS learners","type":"extract","dependsOn":[]},
  {"id":"validate","name":"Validate emails","type":"transform","dependsOn":["extract"]},
  {"id":"map","name":"Map to Contact fields","type":"transform","dependsOn":["validate"]},
  {"id":"qa","name":"Sample QA check","type":"transform","dependsOn":["map"]},
  {"id":"upsert","name":"Upsert Salesforce","type":"load","dependsOn":["map"]},
  {"id":"writeback","name":"Write CRM ids","type":"load","dependsOn":["upsert"]},
  {"id":"metrics","name":"Emit Datadog metrics","type":"notify","dependsOn":["writeback","qa"]},
  {"id":"notify","name":"Slack #workforce-ops","type":"notify","dependsOn":["metrics"]}
]$dag$::jsonb
WHERE id = 'e1000001-0000-0000-0000-000000000001';

-- ─── New example pipelines ─────────────────────────────────────────────────
INSERT INTO integration_pipelines (id, integration_id, name, kind, schedule, status, description, dag, settings) VALUES
('e1000001-0000-0000-0000-000000000008', 'd0000001-0000-0000-0000-000000000001',
 'Nightly Opportunity forecast rollup', 'batch', '30 2 * * *', 'success',
 'Aggregates certified-graduate Opportunities by vertical and writes forecast custom objects + a dashboard snapshot.',
 $dag$[
   {"id":"pull","name":"Pull Opportunities","type":"extract","dependsOn":[]},
   {"id":"agg","name":"Aggregate by vertical","type":"transform","dependsOn":["pull"]},
   {"id":"forecast","name":"Write Forecast__c","type":"load","dependsOn":["agg"]},
   {"id":"snap","name":"Dashboard snapshot","type":"load","dependsOn":["agg"]},
   {"id":"notify","name":"Email revenue-ops","type":"notify","dependsOn":["forecast","snap"]}
 ]$dag$::jsonb,
 '{"retries":2,"timeoutMinutes":35,"concurrency":1,"alertOnFailure":true,"alertChannel":"#employer-success","owner":"revenue-ops","tags":["crm","forecast"]}'::jsonb),

('e1000001-0000-0000-0000-000000000009', 'd0000001-0000-0000-0000-000000000007',
 'HubSpot contact enrichment', 'batch', '0 */6 * * *', 'success',
 'Syncs learner skills, certifications, and program tags into HubSpot contacts for partner nurture sequences.',
 $dag$[
   {"id":"learners","name":"Export learners","type":"extract","dependsOn":[]},
   {"id":"certs","name":"Join certifications","type":"extract","dependsOn":[]},
   {"id":"merge","name":"Merge contact payload","type":"transform","dependsOn":["learners","certs"]},
   {"id":"upsert","name":"HubSpot batch upsert","type":"load","dependsOn":["merge"]},
   {"id":"lists","name":"Update static lists","type":"load","dependsOn":["upsert"]},
   {"id":"notify","name":"Slack partner-success","type":"notify","dependsOn":["lists"]}
 ]$dag$::jsonb,
 '{"retries":3,"timeoutMinutes":40,"concurrency":2,"alertOnFailure":true,"alertChannel":"#employer-success","owner":"partner-success","tags":["crm","enrichment"]}'::jsonb),

('e1000001-0000-0000-0000-000000000010', 'd0000001-0000-0000-0000-000000000008',
 'Canvas gradebook → enrollments', 'batch', '20 * * * *', 'running',
 'Polls Canvas gradebook for mapped courses and advances SuperlativeBridge enrollment progress.',
 $dag$[
   {"id":"courses","name":"List mapped courses","type":"extract","dependsOn":[]},
   {"id":"grades","name":"Fetch gradebook","type":"extract","dependsOn":["courses"]},
   {"id":"map","name":"Map to enrollments","type":"transform","dependsOn":["grades"]},
   {"id":"progress","name":"Update progress %","type":"load","dependsOn":["map"]},
   {"id":"certs","name":"Issue certificates","type":"load","dependsOn":["progress"]},
   {"id":"metrics","name":"Emit job metrics","type":"notify","dependsOn":["certs"]}
 ]$dag$::jsonb,
 '{"retries":2,"timeoutMinutes":25,"concurrency":1,"alertOnFailure":true,"alertChannel":"#workforce-ops","owner":"lms-ops","tags":["lms","grades"]}'::jsonb),

('e1000001-0000-0000-0000-000000000011', 'd0000001-0000-0000-0000-000000000009',
 'Pipeline metrics shipper', 'event', 'on pipeline.*', 'success',
 'Forwards every pipeline run metric (duration, records, errors) to Datadog statsd and log pipelines.',
 $dag$[
   {"id":"recv","name":"Receive run event","type":"extract","dependsOn":[]},
   {"id":"normalize","name":"Normalize metrics","type":"transform","dependsOn":["recv"]},
   {"id":"statsd","name":"statsd.gauge / count","type":"load","dependsOn":["normalize"]},
   {"id":"logs","name":"Ship structured logs","type":"load","dependsOn":["normalize"]},
   {"id":"trace","name":"Close APM span","type":"notify","dependsOn":["statsd","logs"]}
 ]$dag$::jsonb,
 '{"retries":1,"timeoutMinutes":3,"concurrency":16,"alertOnFailure":true,"alertChannel":"#platform-alerts","owner":"sre","tags":["observability"]}'::jsonb),

('e1000001-0000-0000-0000-000000000012', 'd0000001-0000-0000-0000-000000000002',
 'Workday learning plan delta', 'batch', '45 5 * * 1-5', 'idle',
 'Diffs Workday learning plans nightly and enrolls workers whose plan gained a new required course.',
 $dag$[
   {"id":"plans","name":"Pull learning plans","type":"extract","dependsOn":[]},
   {"id":"diff","name":"Diff vs yesterday","type":"transform","dependsOn":["plans"]},
   {"id":"map","name":"Map course ids","type":"transform","dependsOn":["diff"]},
   {"id":"enroll","name":"Enroll deltas","type":"load","dependsOn":["map"]},
   {"id":"report","name":"Write delta report","type":"notify","dependsOn":["enroll"]}
 ]$dag$::jsonb,
 '{"retries":2,"timeoutMinutes":30,"concurrency":1,"alertOnFailure":true,"alertChannel":"#workforce-ops","owner":"people-ops","tags":["hris","delta"]}'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status,
  dag = EXCLUDED.dag,
  description = EXCLUDED.description,
  schedule = EXCLUDED.schedule,
  settings = EXCLUDED.settings;

-- Backfill outputs + metrics on existing runs
UPDATE pipeline_runs SET
  outputs = jsonb_build_object(
    'recordsIn', 12448,
    'recordsOut', 12434,
    'skipped', 14,
    'salesforceContactIdsSample', jsonb_build_array('003xxAAA', '003xxBBB', '003xxCCC'),
    'artifactUri', 's3://sb-demo-artifacts/sf-contact-sync/128/summary.json'
  ),
  metrics = jsonb_build_object(
    'durationMs', 260800,
    'successRate', 0.9989,
    'apiCalls', 18,
    'errorCount', 0,
    'p95TaskMs', 188000,
    'cpuSeconds', 41.2,
    'memoryMbPeak', 512
  )
WHERE id = 'f1000001-0000-0000-0000-000000000101';

UPDATE pipeline_runs SET
  outputs = jsonb_build_object(
    'opportunityId', '006xxQUAL',
    'accountId', '001xxACME',
    'stage', 'Qualified',
    'owner', 'Jordan Lee'
  ),
  metrics = jsonb_build_object(
    'durationMs', 2260,
    'successRate', 1.0,
    'apiCalls', 4,
    'errorCount', 0,
    'p95TaskMs', 1100
  )
WHERE id = 'f1000001-0000-0000-0000-000000000201';

UPDATE pipeline_runs SET
  outputs = jsonb_build_object(
    'hiresIn', 37,
    'enrollmentsCreated', 37,
    'tracks', jsonb_build_object('Healthcare', 29, 'IT', 8)
  ),
  metrics = jsonb_build_object(
    'durationMs', 96400,
    'successRate', 1.0,
    'apiCalls', 6,
    'errorCount', 0,
    'p95TaskMs', 88000
  )
WHERE id = 'f1000001-0000-0000-0000-000000000301';

UPDATE pipeline_runs SET
  outputs = jsonb_build_object(
    'certifiedWorkers', 84,
    'applicationsPosted', 41,
    'pagesComplete', 2,
    'pagesTotal', 3
  ),
  metrics = jsonb_build_object(
    'durationMs', NULL,
    'successRate', NULL,
    'apiCalls', 22,
    'errorCount', 0,
    'recordsPerMinute', 14.2
  )
WHERE id = 'f1000001-0000-0000-0000-000000000401';

UPDATE pipeline_runs SET
  outputs = jsonb_build_object(
    'targets', 412,
    'smsAccepted', 255,
    'smsRejected', 157,
    'emailFallback', 412,
    'carrierError', '21606'
  ),
  metrics = jsonb_build_object(
    'durationMs', 17400,
    'successRate', 0.62,
    'apiCalls', 412,
    'errorCount', 157,
    'p95TaskMs', 6400
  )
WHERE id = 'f1000001-0000-0000-0000-000000000701';

-- New run history with rich outputs
INSERT INTO pipeline_runs (id, pipeline_id, run_number, status, trigger, started_at, finished_at, steps, outputs, metrics) VALUES
('f1000001-0000-0000-0000-000000000801', 'e1000001-0000-0000-0000-000000000008', 12, 'success', 'schedule',
 now() - interval '8 hours', now() - interval '7 hours 48 minutes',
 $s$[
   {"nodeId":"pull","name":"Pull Opportunities","status":"success","durationMs":42000,"log":"1,184 open Opportunities"},
   {"nodeId":"agg","name":"Aggregate by vertical","status":"success","durationMs":3100,"log":"6 vertical buckets"},
   {"nodeId":"forecast","name":"Write Forecast__c","status":"success","durationMs":18000,"log":"6 Forecast__c upserted"},
   {"nodeId":"snap","name":"Dashboard snapshot","status":"success","durationMs":2200,"log":"Snapshot id=snap_8841"},
   {"nodeId":"notify","name":"Email revenue-ops","status":"success","durationMs":900,"log":"Sent to revenue-ops@"}
 ]$s$::jsonb,
 '{"opportunitiesIn":1184,"forecastRows":6,"snapshotId":"snap_8841","pipelineValueUsd":4820000}'::jsonb,
 '{"durationMs":66200,"successRate":1.0,"apiCalls":9,"errorCount":0,"p95TaskMs":42000}'::jsonb),

('f1000001-0000-0000-0000-000000000901', 'e1000001-0000-0000-0000-000000000009', 61, 'success', 'schedule',
 now() - interval '27 minutes', now() - interval '19 minutes',
 $s$[
   {"nodeId":"learners","name":"Export learners","status":"success","durationMs":28000,"log":"3,902 active learners"},
   {"nodeId":"certs","name":"Join certifications","status":"success","durationMs":11000,"log":"1,144 cert rows"},
   {"nodeId":"merge","name":"Merge contact payload","status":"success","durationMs":6000,"log":"3,902 contact payloads"},
   {"nodeId":"upsert","name":"HubSpot batch upsert","status":"success","durationMs":210000,"log":"3,887 updated, 15 created"},
   {"nodeId":"lists","name":"Update static lists","status":"success","durationMs":14000,"log":"4 lists refreshed"},
   {"nodeId":"notify","name":"Slack partner-success","status":"success","durationMs":400,"log":"ok"}
 ]$s$::jsonb,
 '{"contactsUpserted":3902,"listsUpdated":["Certified Healthcare","IT Track","Open to Work","Partners"],"hubspotBatchId":"batch_9912"}'::jsonb,
 '{"durationMs":269400,"successRate":1.0,"apiCalls":44,"errorCount":0,"p95TaskMs":210000,"memoryMbPeak":768}'::jsonb),

('f1000001-0000-0000-0000-000000001001', 'e1000001-0000-0000-0000-000000000010', 208, 'running', 'schedule',
 now() - interval '4 minutes', NULL,
 $s$[
   {"nodeId":"courses","name":"List mapped courses","status":"success","durationMs":1200,"log":"14 Canvas courses mapped"},
   {"nodeId":"grades","name":"Fetch gradebook","status":"success","durationMs":48000,"log":"2,211 grade rows"},
   {"nodeId":"map","name":"Map to enrollments","status":"running","durationMs":0,"log":"Mapping course 9/14…"},
   {"nodeId":"progress","name":"Update progress %","status":"queued","durationMs":0,"log":""},
   {"nodeId":"certs","name":"Issue certificates","status":"queued","durationMs":0,"log":""},
   {"nodeId":"metrics","name":"Emit job metrics","status":"queued","durationMs":0,"log":""}
 ]$s$::jsonb,
 '{"coursesMapped":14,"gradeRows":2211,"progressUpdated":0,"partial":true}'::jsonb,
 '{"durationMs":null,"apiCalls":31,"errorCount":0,"recordsPerMinute":38.4}'::jsonb),

('f1000001-0000-0000-0000-000000001101', 'e1000001-0000-0000-0000-000000000011', 4401, 'success', 'webhook',
 now() - interval '2 minutes', now() - interval '2 minutes',
 $s$[
   {"nodeId":"recv","name":"Receive run event","status":"success","durationMs":12,"log":"pipeline.success hubspot-enrich #61"},
   {"nodeId":"normalize","name":"Normalize metrics","status":"success","durationMs":8,"log":"8 metric points"},
   {"nodeId":"statsd","name":"statsd.gauge / count","status":"success","durationMs":15,"log":"ok"},
   {"nodeId":"logs","name":"Ship structured logs","status":"success","durationMs":40,"log":"ok"},
   {"nodeId":"trace","name":"Close APM span","status":"success","durationMs":6,"log":"trace_id=9af3…"}
 ]$s$::jsonb,
 '{"metricsShipped":8,"traceId":"9af3c2e1","logEvents":3}'::jsonb,
 '{"durationMs":81,"successRate":1.0,"apiCalls":2,"errorCount":0}'::jsonb),

('f1000001-0000-0000-0000-000000000103', 'e1000001-0000-0000-0000-000000000001', 126, 'failed', 'schedule',
 now() - interval '1 day', now() - interval '23 hours 55 minutes',
 $s$[
   {"nodeId":"extract","name":"Extract LMS learners","status":"success","durationMs":40000,"log":"ok"},
   {"nodeId":"validate","name":"Validate emails","status":"success","durationMs":5000,"log":"ok"},
   {"nodeId":"map","name":"Map to Contact fields","status":"success","durationMs":8000,"log":"ok"},
   {"nodeId":"qa","name":"Sample QA check","status":"success","durationMs":2000,"log":"ok"},
   {"nodeId":"upsert","name":"Upsert Salesforce","status":"failed","durationMs":12000,"log":"REQUEST_LIMIT_EXCEEDED"},
   {"nodeId":"writeback","name":"Write CRM ids","status":"queued","durationMs":0,"log":""},
   {"nodeId":"metrics","name":"Emit Datadog metrics","status":"queued","durationMs":0,"log":""},
   {"nodeId":"notify","name":"Slack #workforce-ops","status":"queued","durationMs":0,"log":""}
 ]$s$::jsonb,
 '{"error":"REQUEST_LIMIT_EXCEEDED","recordsAttempted":4200,"recordsCommitted":0}'::jsonb,
 '{"durationMs":67000,"successRate":0.0,"apiCalls":3,"errorCount":1,"p95TaskMs":40000}'::jsonb)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'sbuser') THEN
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
    GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbuser;
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vivekvardhan') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vivekvardhan;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vivekvardhan;
  END IF;
END $$;
