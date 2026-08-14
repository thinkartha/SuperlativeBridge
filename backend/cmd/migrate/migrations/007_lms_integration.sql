-- LMS integration layer: third-party course providers, external course map, sync jobs.

CREATE TABLE IF NOT EXISTS lms_providers (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  kind         TEXT NOT NULL DEFAULT 'lms',
  status       TEXT NOT NULL DEFAULT 'configured',
  base_url     TEXT NOT NULL DEFAULT '',
  description  TEXT NOT NULL DEFAULT '',
  config       JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_sync_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID,
  updated_by   UUID,
  deleted_at   TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS lms_external_courses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES lms_providers(id) ON DELETE CASCADE,
  external_id  TEXT NOT NULL,
  course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  payload      JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID,
  updated_by   UUID,
  deleted_at   TIMESTAMPTZ,
  UNIQUE (provider_id, external_id)
);
CREATE INDEX IF NOT EXISTS idx_lms_ext_course ON lms_external_courses (course_id);
CREATE INDEX IF NOT EXISTS idx_lms_ext_provider ON lms_external_courses (provider_id);

CREATE TABLE IF NOT EXISTS lms_sync_jobs (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id  UUID NOT NULL REFERENCES lms_providers(id) ON DELETE CASCADE,
  job_type     TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'queued',
  request      JSONB,
  result       JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at  TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by   UUID,
  updated_by   UUID,
  deleted_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_lms_jobs_created ON lms_sync_jobs (created_at DESC);

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['lms_providers', 'lms_external_courses', 'lms_sync_jobs'];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
        t, t
      );
    END IF;
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'write_audit_log') THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_audit ON %I', t, t);
      EXECUTE format(
        'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION write_audit_log()',
        t, t
      );
    END IF;
  END LOOP;
END $$;

INSERT INTO lms_providers (id, slug, name, kind, status, base_url, description, config) VALUES
('a2000001-0000-0000-0000-000000000001', 'salesforce', 'Salesforce LMS Connector', 'crm', 'connected',
 'https://superlativebridge.my.salesforce.com',
 'Pulls curriculum metadata from Salesforce custom objects and pushes certifications back.',
 '{"objects":["Course__c","Certification__c"],"auth":"OAuth JWT"}'::jsonb),
('a2000001-0000-0000-0000-000000000002', 'moodle', 'Moodle / Open LMS', 'lms', 'configured',
 'https://lms.example.org',
 'Imports courses and modules via REST webservice tokens.',
 '{"service":"moodle_webservice","format":"json"}'::jsonb),
('a2000001-0000-0000-0000-000000000003', 'canvas', 'Canvas LMS', 'lms', 'configured',
 'https://canvas.instructure.com',
 'Partner Canvas tenant course catalog sync.',
 '{"api":"v1"}'::jsonb),
('a2000001-0000-0000-0000-000000000004', 'workday-learning', 'Workday Learning', 'hris', 'connected',
 'https://wd5-services1.myworkday.com',
 'Maps Workday learning content to SuperlativeBridge tracks.',
 '{"raas":"INT_Learning_Catalog"}'::jsonb)
ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, config = EXCLUDED.config;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO sbuser;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO sbuser;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'vivekvardhan') THEN
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vivekvardhan;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vivekvardhan;
  END IF;
END $$;
