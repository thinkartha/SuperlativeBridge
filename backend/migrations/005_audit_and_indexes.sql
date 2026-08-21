-- Audit columns, row-change log, updated_at triggers, and scalability indexes.
-- Additive and idempotent.

-- ─── Audit log (security / UI) ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name  TEXT NOT NULL,
  record_id   TEXT,
  action      TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  actor_id    UUID,
  actor_email TEXT NOT NULL DEFAULT '',
  old_data    JSONB,
  new_data    JSONB,
  changed_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log (changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_changed ON audit_log (table_name, changed_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_record ON audit_log (table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_actor ON audit_log (actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log (action);

-- ─── Standard audit columns on every business table ────────────────────────
DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'categories', 'users', 'skills', 'courses', 'modules', 'quizzes', 'mentors',
    'enrollments', 'certifications', 'notifications', 'programs', 'visa_programs',
    'marketplace_entries', 'community_posts', 'community_events', 'community_groups',
    'entrepreneurship_tracks', 'entrepreneurship_resources', 'candidates',
    'saved_courses', 'mentor_bookings', 'platform_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT now()', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now()', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS created_by UUID', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS updated_by UUID', t);
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ', t);
  END LOOP;
END $$;

-- ─── Keep updated_at current ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'categories', 'users', 'skills', 'courses', 'modules', 'quizzes', 'mentors',
    'enrollments', 'certifications', 'notifications', 'programs', 'visa_programs',
    'marketplace_entries', 'community_posts', 'community_events', 'community_groups',
    'entrepreneurship_tracks', 'entrepreneurship_resources', 'candidates',
    'saved_courses', 'mentor_bookings', 'platform_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()',
      t, t
    );
  END LOOP;
END $$;

-- ─── Row-level audit (strips password_hash) ────────────────────────────────
CREATE OR REPLACE FUNCTION write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  rec_id text;
  actor uuid;
  actor_email text := '';
  old_j jsonb;
  new_j jsonb;
BEGIN
  BEGIN
    actor := NULLIF(current_setting('app.current_user_id', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    actor := NULL;
  END;

  IF actor IS NOT NULL THEN
    SELECT email INTO actor_email FROM users WHERE id = actor;
    actor_email := COALESCE(actor_email, '');
  END IF;

  IF TG_OP = 'DELETE' THEN
    rec_id := OLD.id::text;
    old_j := to_jsonb(OLD) - 'password_hash';
    INSERT INTO audit_log (table_name, record_id, action, actor_id, actor_email, old_data, new_data)
    VALUES (TG_TABLE_NAME, rec_id, 'DELETE', actor, actor_email, old_j, NULL);
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    rec_id := NEW.id::text;
    old_j := to_jsonb(OLD) - 'password_hash';
    new_j := to_jsonb(NEW) - 'password_hash';
    IF old_j IS DISTINCT FROM new_j THEN
      INSERT INTO audit_log (table_name, record_id, action, actor_id, actor_email, old_data, new_data)
      VALUES (TG_TABLE_NAME, rec_id, 'UPDATE', actor, actor_email, old_j, new_j);
    END IF;
    RETURN NEW;
  ELSE
    rec_id := NEW.id::text;
    new_j := to_jsonb(NEW) - 'password_hash';
    INSERT INTO audit_log (table_name, record_id, action, actor_id, actor_email, old_data, new_data)
    VALUES (TG_TABLE_NAME, rec_id, 'INSERT', actor, actor_email, NULL, new_j);
    RETURN NEW;
  END IF;
END;
$$;

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'categories', 'users', 'skills', 'courses', 'modules', 'quizzes', 'mentors',
    'enrollments', 'certifications', 'notifications', 'programs', 'visa_programs',
    'marketplace_entries', 'community_posts', 'community_events', 'community_groups',
    'entrepreneurship_tracks', 'entrepreneurship_resources', 'candidates',
    'saved_courses', 'mentor_bookings', 'platform_settings'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_audit ON %I', t, t);
    EXECUTE format(
      'CREATE TRIGGER trg_%s_audit AFTER INSERT OR UPDATE OR DELETE ON %I FOR EACH ROW EXECUTE FUNCTION write_audit_log()',
      t, t
    );
  END LOOP;
END $$;

-- ─── Scalability indexes (FKs, filters, search) ────────────────────────────
CREATE INDEX IF NOT EXISTS idx_users_status ON users (status);
CREATE INDEX IF NOT EXISTS idx_users_email_lower ON users (lower(email));
CREATE INDEX IF NOT EXISTS idx_users_deleted_at ON users (deleted_at) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_mentors_status ON mentors (status);
CREATE INDEX IF NOT EXISTS idx_mentors_vertical ON mentors (vertical);
CREATE INDEX IF NOT EXISTS idx_mentors_email_lower ON mentors (lower(email));

CREATE INDEX IF NOT EXISTS idx_courses_category ON courses (category);
CREATE INDEX IF NOT EXISTS idx_courses_language ON courses (language);
CREATE INDEX IF NOT EXISTS idx_courses_title_lower ON courses (lower(title));
CREATE INDEX IF NOT EXISTS idx_courses_status_vertical ON courses (status, vertical);

CREATE INDEX IF NOT EXISTS idx_enrollments_progress ON enrollments (progress);
CREATE INDEX IF NOT EXISTS idx_enrollments_completed ON enrollments (course_id) WHERE progress = 100;

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications (user_id, created_at DESC) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts (author_id);

CREATE INDEX IF NOT EXISTS idx_candidates_user_id ON candidates (user_id);
CREATE INDEX IF NOT EXISTS idx_candidates_location ON candidates (location);

CREATE INDEX IF NOT EXISTS idx_mentor_bookings_status ON mentor_bookings (status);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor_sched ON mentor_bookings (mentor_id, scheduled_at);

CREATE INDEX IF NOT EXISTS idx_certifications_status ON certifications (status);
CREATE INDEX IF NOT EXISTS idx_certifications_expires_at ON certifications (expires_at);

CREATE INDEX IF NOT EXISTS idx_marketplace_name_lower ON marketplace_entries (lower(name));
CREATE INDEX IF NOT EXISTS idx_programs_title_lower ON programs (lower(title));

-- ─── Backfill created_by from platform admin ───────────────────────────────
UPDATE users SET created_by = id WHERE email = 'admin@example.com' AND created_by IS NULL;

UPDATE users u
SET created_by = a.id
FROM users a
WHERE a.email = 'admin@example.com'
  AND u.created_by IS NULL
  AND u.email <> 'admin@example.com';

-- ─── Seed audit history so the UI has data immediately ─────────────────────
INSERT INTO audit_log (table_name, record_id, action, actor_email, new_data, changed_at)
SELECT 'users', id::text, 'INSERT', email,
       jsonb_build_object('name', name, 'email', email, 'role', role, 'status', status),
       created_at
FROM users
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log al WHERE al.table_name = 'users' AND al.record_id = users.id::text AND al.action = 'INSERT'
);

INSERT INTO audit_log (table_name, record_id, action, actor_email, new_data, changed_at)
SELECT 'courses', id::text, 'INSERT', instructor,
       jsonb_build_object('title', title, 'status', status, 'vertical', vertical),
       created_at
FROM courses
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log al WHERE al.table_name = 'courses' AND al.record_id = courses.id::text AND al.action = 'INSERT'
);

INSERT INTO audit_log (table_name, record_id, action, actor_email, new_data, changed_at)
SELECT 'mentors', id::text, 'INSERT', email,
       jsonb_build_object('name', name, 'email', email, 'status', status),
       created_at
FROM mentors
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log al WHERE al.table_name = 'mentors' AND al.record_id = mentors.id::text AND al.action = 'INSERT'
);

INSERT INTO audit_log (table_name, record_id, action, actor_email, new_data, changed_at)
SELECT 'mentor_bookings', id::text, 'INSERT', '',
       jsonb_build_object('status', status, 'topic', topic, 'scheduledAt', scheduled_at),
       created_at
FROM mentor_bookings
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log al WHERE al.table_name = 'mentor_bookings' AND al.record_id = mentor_bookings.id::text AND al.action = 'INSERT'
);

INSERT INTO audit_log (table_name, record_id, action, actor_email, new_data, changed_at)
SELECT 'enrollments', id::text, 'INSERT', '',
       jsonb_build_object('progress', progress, 'xp', xp, 'userId', user_id, 'courseId', course_id),
       created_at
FROM enrollments
WHERE NOT EXISTS (
  SELECT 1 FROM audit_log al WHERE al.table_name = 'enrollments' AND al.record_id = enrollments.id::text AND al.action = 'INSERT'
);

-- ─── Grants ────────────────────────────────────────────────────────────────
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
