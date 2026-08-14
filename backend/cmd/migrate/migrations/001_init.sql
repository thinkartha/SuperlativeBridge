-- SuperlativeBridge schema
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS categories (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name          TEXT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    icon          TEXT NOT NULL DEFAULT '',
    color         TEXT NOT NULL DEFAULT '',
    course_count  INT NOT NULL DEFAULT 0,
    status        TEXT NOT NULL DEFAULT 'Active'
);

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    role        TEXT NOT NULL CHECK (role IN ('admin','worker','employer','mentor')),
    vertical    TEXT NOT NULL DEFAULT '',
    location    TEXT NOT NULL DEFAULT '',
    phone       TEXT NOT NULL DEFAULT '',
    bio         TEXT NOT NULL DEFAULT '',
    avatar      TEXT NOT NULL DEFAULT '',
    status      TEXT NOT NULL DEFAULT 'Active',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

CREATE TABLE IF NOT EXISTS skills (
    id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name    TEXT NOT NULL,
    level   INT NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_skills_user_id ON skills(user_id);

CREATE TABLE IF NOT EXISTS courses (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    category    TEXT NOT NULL DEFAULT '',
    vertical    TEXT NOT NULL DEFAULT '',
    language    TEXT NOT NULL DEFAULT 'English',
    level       TEXT NOT NULL DEFAULT 'Beginner',
    duration    TEXT NOT NULL DEFAULT '',
    students    INT NOT NULL DEFAULT 0,
    rating      NUMERIC(2,1) NOT NULL DEFAULT 0,
    instructor  TEXT NOT NULL DEFAULT '',
    image       TEXT NOT NULL DEFAULT '/placeholder.svg',
    status      TEXT NOT NULL DEFAULT 'Draft'
);
CREATE INDEX IF NOT EXISTS idx_courses_vertical ON courses(vertical);
CREATE INDEX IF NOT EXISTS idx_courses_status ON courses(status);
CREATE INDEX IF NOT EXISTS idx_courses_level ON courses(level);

CREATE TABLE IF NOT EXISTS modules (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id  UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    "order"    INT NOT NULL DEFAULT 0,
    video_url  TEXT NOT NULL DEFAULT '',
    duration   TEXT NOT NULL DEFAULT '',
    content    TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_modules_course_id ON modules(course_id);

CREATE TABLE IF NOT EXISTS quizzes (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    module_id  UUID NOT NULL REFERENCES modules(id) ON DELETE CASCADE,
    title      TEXT NOT NULL,
    pass_score INT NOT NULL DEFAULT 70,
    xp_reward  INT NOT NULL DEFAULT 0,
    questions  JSONB NOT NULL DEFAULT '[]'
);
CREATE INDEX IF NOT EXISTS idx_quizzes_module_id ON quizzes(module_id);

CREATE TABLE IF NOT EXISTS mentors (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    expertise  TEXT[] NOT NULL DEFAULT '{}',
    vertical   TEXT NOT NULL DEFAULT '',
    bio        TEXT NOT NULL DEFAULT '',
    rating     NUMERIC(2,1) NOT NULL DEFAULT 0,
    students   INT NOT NULL DEFAULT 0,
    status     TEXT NOT NULL DEFAULT 'Active',
    avatar     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS enrollments (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id    UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    progress     INT NOT NULL DEFAULT 0,
    xp           INT NOT NULL DEFAULT 0,
    grade        TEXT NOT NULL DEFAULT '',
    enrolled_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, course_id)
);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_id ON enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);

CREATE TABLE IF NOT EXISTS certifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    issuer     TEXT NOT NULL DEFAULT '',
    expires_at TIMESTAMPTZ,
    status     TEXT NOT NULL DEFAULT 'active'
);
CREATE INDEX IF NOT EXISTS idx_certifications_user_id ON certifications(user_id);

CREATE TABLE IF NOT EXISTS notifications (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       TEXT NOT NULL DEFAULT 'general',
    message    TEXT NOT NULL,
    read       BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

CREATE TABLE IF NOT EXISTS programs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title        TEXT NOT NULL,
    agency       TEXT NOT NULL DEFAULT '',
    description  TEXT NOT NULL DEFAULT '',
    program_type TEXT NOT NULL DEFAULT '',
    eligibility  TEXT[] NOT NULL DEFAULT '{}',
    funding      TEXT NOT NULL DEFAULT '',
    deadline     TEXT NOT NULL DEFAULT '',
    verticals    TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_programs_type ON programs(program_type);

CREATE TABLE IF NOT EXISTS visa_programs (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title          TEXT NOT NULL,
    visa_type      TEXT NOT NULL,
    category       TEXT NOT NULL DEFAULT '',
    description    TEXT NOT NULL DEFAULT '',
    eligibility    TEXT[] NOT NULL DEFAULT '{}',
    duration       TEXT NOT NULL DEFAULT '',
    industry_match TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_visa_programs_type ON visa_programs(visa_type);

CREATE TABLE IF NOT EXISTS marketplace_entries (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,
    vertical    TEXT NOT NULL DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    location    TEXT NOT NULL DEFAULT '',
    founded     TEXT NOT NULL DEFAULT '',
    employees   TEXT NOT NULL DEFAULT '',
    tags        TEXT[] NOT NULL DEFAULT '{}'
);
CREATE INDEX IF NOT EXISTS idx_marketplace_vertical ON marketplace_entries(vertical);

CREATE TABLE IF NOT EXISTS community_posts (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    author     TEXT NOT NULL DEFAULT '',
    title      TEXT NOT NULL,
    body       TEXT NOT NULL DEFAULT '',
    category   TEXT NOT NULL DEFAULT '',
    likes      INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS community_events (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title      TEXT NOT NULL,
    event_date DATE NOT NULL,
    type       TEXT NOT NULL DEFAULT '',
    attendees  INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS community_groups (
    id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name     TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT '',
    members  INT NOT NULL DEFAULT 0,
    icon     TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS entrepreneurship_tracks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT '',
    "order"     INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS entrepreneurship_resources (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category    TEXT NOT NULL DEFAULT '',
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    icon        TEXT NOT NULL DEFAULT '',
    items       INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS candidates (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID REFERENCES users(id) ON DELETE SET NULL,
    name         TEXT NOT NULL,
    title        TEXT NOT NULL DEFAULT '',
    skills       TEXT[] NOT NULL DEFAULT '{}',
    location     TEXT NOT NULL DEFAULT '',
    zip          TEXT NOT NULL DEFAULT '',
    billing_rate INT NOT NULL DEFAULT 0,
    vertical     TEXT NOT NULL DEFAULT '',
    education    TEXT NOT NULL DEFAULT '',
    programs     TEXT[] NOT NULL DEFAULT '{}',
    rating       NUMERIC(2,1) NOT NULL DEFAULT 0,
    experience   TEXT NOT NULL DEFAULT '',
    bio          TEXT NOT NULL DEFAULT '',
    email        TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_candidates_vertical ON candidates(vertical);
