-- v1.1 additions: enrollments extras, saved courses, mentor bookings
-- Idempotent: safe to run repeatedly (docker-compose applies all migrations on init).

ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS last_module_id UUID REFERENCES modules(id) ON DELETE SET NULL;
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
-- enrolled_at already exists from 001_schema.sql; keep for compatibility.

CREATE TABLE IF NOT EXISTS saved_courses (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    saved_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_saved_courses_user_id ON saved_courses(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_courses_course_id ON saved_courses(course_id);

CREATE TABLE IF NOT EXISTS mentor_bookings (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    mentor_id        UUID NOT NULL REFERENCES mentors(id) ON DELETE CASCADE,
    scheduled_at     TIMESTAMPTZ NOT NULL,
    duration_minutes INT NOT NULL DEFAULT 30,
    topic            TEXT NOT NULL DEFAULT '',
    notes            TEXT NOT NULL DEFAULT '',
    status           TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','confirmed','completed','cancelled')),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_user_id ON mentor_bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_mentor_id ON mentor_bookings(mentor_id);
CREATE INDEX IF NOT EXISTS idx_mentor_bookings_scheduled_at ON mentor_bookings(scheduled_at);

-- ─── Demo seed data (idempotent) ───

-- Saved courses for worker users
INSERT INTO saved_courses (user_id, course_id, saved_at)
SELECT u.id, c.id, now() - interval '3 days'
FROM users u, courses c
WHERE u.email = 'maria@example.com' AND c.title = 'Cloud Architecture (AWS/Azure)'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO saved_courses (user_id, course_id, saved_at)
SELECT u.id, c.id, now() - interval '1 day'
FROM users u, courses c
WHERE u.email = 'maria@example.com' AND c.title = 'Machine Learning Bootcamp'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO saved_courses (user_id, course_id, saved_at)
SELECT u.id, c.id, now() - interval '5 days'
FROM users u, courses c
WHERE u.email = 'james@example.com' AND c.title = 'Python for Data Science'
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO saved_courses (user_id, course_id, saved_at)
SELECT u.id, c.id, now() - interval '2 days'
FROM users u, courses c
WHERE u.email = 'sarah@example.com' AND c.title = 'Full-Stack Web Development'
ON CONFLICT (user_id, course_id) DO NOTHING;

-- Mentor bookings (upcoming + past) for worker users
INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() + interval '3 days', 45, 'Career growth in cloud engineering', 'Would like to discuss AWS certification path.', 'confirmed'
FROM users u, mentors m
WHERE u.email = 'maria@example.com' AND m.email = 'mchen@example.com'
AND NOT EXISTS (SELECT 1 FROM mentor_bookings mb WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = 'Career growth in cloud engineering');

INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() - interval '10 days', 30, 'Resume review', 'Reviewed resume for data science roles.', 'completed'
FROM users u, mentors m
WHERE u.email = 'maria@example.com' AND m.email = 'sarah@example.com'
AND NOT EXISTS (SELECT 1 FROM mentor_bookings mb WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = 'Resume review');

INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() + interval '1 day', 60, 'Cybersecurity fundamentals Q&A', '', 'requested'
FROM users u, mentors m
WHERE u.email = 'james@example.com' AND m.email = 'aisha.mentor@example.com'
AND NOT EXISTS (SELECT 1 FROM mentor_bookings mb WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = 'Cybersecurity fundamentals Q&A');

INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() - interval '20 days', 45, 'UX portfolio feedback', 'Great progress on portfolio.', 'completed'
FROM users u, mentors m
WHERE u.email = 'sarah@example.com' AND m.email = 'ezhang@example.com'
AND NOT EXISTS (SELECT 1 FROM mentor_bookings mb WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = 'UX portfolio feedback');

INSERT INTO mentor_bookings (user_id, mentor_id, scheduled_at, duration_minutes, topic, notes, status)
SELECT u.id, m.id, now() + interval '5 days', 30, 'Trades certification guidance', '', 'requested'
FROM users u, mentors m
WHERE u.email = 'carlos@example.com' AND m.email = 'carlos.mentor@example.com'
AND NOT EXISTS (SELECT 1 FROM mentor_bookings mb WHERE mb.user_id = u.id AND mb.mentor_id = m.id AND mb.topic = 'Trades certification guidance');
