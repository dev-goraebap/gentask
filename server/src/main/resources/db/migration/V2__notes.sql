CREATE TABLE notes (
    id varchar(12) PRIMARY KEY,
    owner_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id varchar(12) REFERENCES projects(id) ON DELETE SET NULL,
    body text NOT NULL DEFAULT '',
    shared boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL
);
CREATE INDEX ix_notes_owner_created ON notes(owner_id, created_at DESC, id);
CREATE INDEX ix_notes_project_created ON notes(project_id, created_at DESC, id);
