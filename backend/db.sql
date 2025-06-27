-- ================================================================
-- MICRODOCS – CORE SCHEMA (SELF-HOSTED + AUTH + ENGLISH VERSION)
-- ================================================================

-- Required extension for bcrypt support
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========================================
-- 1. Users
-- ========================================
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(100),
    email           VARCHAR(255) UNIQUE NOT NULL,
    password_hash   TEXT NOT NULL,                        -- Hashed password (bcrypt)
    role            VARCHAR(50) DEFAULT 'user',           -- 'user' | 'admin'
    status          VARCHAR(20) DEFAULT 'active',         -- 'active' | 'suspended'
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    last_login      TIMESTAMP,
    deleted_at      TIMESTAMP
);

-- ========================================
-- 2. Projects
-- ========================================
CREATE TABLE projects (
    id                  SERIAL PRIMARY KEY,
    name                VARCHAR(100) NOT NULL,
    slug                VARCHAR(100) UNIQUE NOT NULL,
    description         TEXT,
    owner_id            INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visibility          VARCHAR(20) DEFAULT 'private',     -- 'private' | 'public'
    created_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMP,
    status              VARCHAR(20) DEFAULT 'active'       -- 'active' | 'archived'
);

CREATE INDEX idx_projects_owner ON projects(owner_id);

-- ========================================
-- 3. Project Collaborators
-- ========================================
CREATE TABLE project_collaborators (
    project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role           VARCHAR(50) DEFAULT 'editor',           -- 'owner' | 'editor' | 'viewer'
    joined_at      TIMESTAMP DEFAULT NOW(),
    state          VARCHAR(20) DEFAULT 'active',           -- 'active' | 'invited'
    PRIMARY KEY (project_id, user_id)
);

-- ========================================
-- 4. Services (Nodes)
-- ========================================
CREATE TABLE services (
    id                SERIAL PRIMARY KEY,
    project_id        INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    type              VARCHAR(50) NOT NULL,                 -- API, DB, etc.
    status            VARCHAR(20) DEFAULT 'active',         -- 'active' | 'inactive'
    version           VARCHAR(50),
    language          VARCHAR(50),
    environment       VARCHAR(20) DEFAULT 'production',     -- 'production' | 'development'
    deploy_url        VARCHAR(255),
    domain            VARCHAR(255),
    git_repo          VARCHAR(255),
    health_metrics    JSONB,
    metadata          JSONB,
    pos_x             INTEGER DEFAULT 0,
    pos_y             INTEGER DEFAULT 0,
    notes             TEXT,
    created_by        INTEGER NOT NULL REFERENCES users(id),
    updated_by        INTEGER REFERENCES users(id),
    created_at        TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_services_project ON services(project_id);

-- ========================================
-- 5. Dependencies (Edges)
-- ========================================
CREATE TABLE dependencies (
    id                 SERIAL PRIMARY KEY,
    source_id          INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    target_id          INTEGER NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    type               VARCHAR(50),                         -- HTTP, gRPC, etc.
    description        TEXT,
    protocol           VARCHAR(50),                         -- REST, GraphQL, Kafka, etc.
    method             VARCHAR(20),                         -- GET, POST, etc.
    created_by         INTEGER NOT NULL REFERENCES users(id),
    updated_by         INTEGER REFERENCES users(id),
    created_at         TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_dependencies_source ON dependencies(source_id);
CREATE INDEX idx_dependencies_target ON dependencies(target_id);

-- ========================================
-- 6. Change History
-- ========================================
CREATE TABLE change_history (
    id             SERIAL PRIMARY KEY,
    project_id     INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    service_id     INTEGER REFERENCES services(id) ON DELETE SET NULL,
    user_id        INTEGER NOT NULL REFERENCES users(id) ON DELETE SET NULL,
    action         VARCHAR(50) NOT NULL,                     -- e.g. 'create_service'
    details        JSONB,
    timestamp      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_history_project ON change_history(project_id);

-- ========================================
-- 7. Diagram Versions (Snapshots)
-- ========================================
CREATE TABLE diagram_versions (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    version_num     INTEGER NOT NULL,
    snapshot        JSONB NOT NULL,
    created_by      INTEGER NOT NULL REFERENCES users(id),
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    notes           TEXT,
    UNIQUE (project_id, version_num)
);

-- ========================================
-- 8. Comments (on services or project)
-- ========================================
CREATE TABLE comments (
    id              SERIAL PRIMARY KEY,
    project_id      INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    service_id      INTEGER REFERENCES services(id) ON DELETE CASCADE,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id       INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    content         TEXT NOT NULL,
    type            VARCHAR(20) DEFAULT 'general',           -- general | issue | improvement
    status          VARCHAR(20) DEFAULT 'active',            -- active | edited | deleted
    created_at      TIMESTAMP NOT NULL DEFAULT NOW(),
    edited_at       TIMESTAMP
);

CREATE INDEX idx_comments_project ON comments(project_id);
CREATE INDEX idx_comments_service ON comments(service_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- ========================================
-- 9. Initial Admin Seeder
-- ========================================
--DO
--$$
--DECLARE
--    existing_count BIGINT;
--BEGIN
--    SELECT COUNT(*) INTO existing_count FROM users;
--    IF existing_count = 0 THEN
--        INSERT INTO users (name, email, password_hash, role)
--        VALUES (
--            'Administrator',
--            current_setting('ADMIN_EMAIL', true),
--            crypt(current_setting('ADMIN_PASSWORD', true), gen_salt('bf')),
--            'admin'
--        );
--        RAISE NOTICE 'Initial admin user created (%).',
--            current_setting('ADMIN_EMAIL', true);
--    END IF;
--END;
--$$ LANGUAGE plpgsql;
