CREATE TABLE accounts (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    provider varchar(20) NOT NULL,
    provider_account_id varchar(255) NOT NULL,
    password_hash varchar(100),
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_accounts_credential_password CHECK ((provider = 'credential' and password_hash is not null) or (provider <> 'credential' and password_hash is null))
);

CREATE TABLE api_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash varchar(64) NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE attachments (
    id uuid NOT NULL,
    blob_id uuid NOT NULL,
    owner_type varchar(32) NOT NULL,
    owner_id uuid NOT NULL,
    name varchar(32) NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE blobs (
    id uuid NOT NULL,
    storage_key varchar(512) NOT NULL,
    file_name varchar(255) NOT NULL,
    content_type varchar(100) NOT NULL,
    byte_size bigint NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE artifact_folders (
    id varchar(12) NOT NULL,
    project_id varchar(12),
    owner_id uuid,
    name varchar(200) NOT NULL,
    parent_id varchar(12),
    created_at timestamptz NOT NULL,
    created_by uuid NOT NULL,
    updated_at timestamptz NOT NULL,
    updated_by uuid NOT NULL,
    CONSTRAINT ck_artifact_folders_name_not_blank CHECK (btrim(name) <> ''),
    CONSTRAINT ck_artifact_folders_parent_not_self CHECK (parent_id <> id),
    CONSTRAINT ck_artifact_folders_scope CHECK ((project_id IS NOT NULL AND owner_id IS NULL) OR (project_id IS NULL AND owner_id IS NOT NULL))
);

CREATE TABLE artifact_revisions (
    id uuid NOT NULL,
    artifact_id varchar(12) NOT NULL,
    revision_no integer NOT NULL,
    title varchar(200) NOT NULL,
    body text DEFAULT '' NOT NULL,
    content_sha1 character(40) NOT NULL,
    comment varchar(200),
    created_at timestamptz NOT NULL,
    created_by uuid NOT NULL,
    CONSTRAINT ck_artifact_revisions_no CHECK (revision_no >= 1),
    CONSTRAINT ck_artifact_revisions_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE artifacts (
    id varchar(12) NOT NULL,
    project_id varchar(12),
    owner_id uuid,
    title varchar(200) NOT NULL,
    head_revision_id uuid,
    deleted_at timestamptz,
    deleted_by uuid,
    created_at timestamptz NOT NULL,
    created_by uuid NOT NULL,
    updated_at timestamptz NOT NULL,
    updated_by uuid NOT NULL,
    folder_id varchar(12),
    CONSTRAINT ck_artifacts_deleted CHECK ((deleted_at is null and deleted_by is null) or (deleted_at is not null and deleted_by is not null)),
    CONSTRAINT ck_artifacts_title_not_blank CHECK (btrim(title) <> ''),
    CONSTRAINT ck_artifacts_scope CHECK ((project_id IS NOT NULL AND owner_id IS NULL) OR (project_id IS NULL AND owner_id IS NOT NULL))
);

CREATE TABLE issues (
    id uuid NOT NULL,
    project_id varchar(12) NOT NULL,
    number integer NOT NULL,
    kind varchar(20) NOT NULL,
    state varchar(20) NOT NULL,
    title varchar(200) NOT NULL,
    body text DEFAULT '' NOT NULL,
    parent_id uuid,
    ordinal integer NOT NULL,
    author_id uuid NOT NULL,
    due_date date,
    closed_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_issues_closed_at CHECK ((state in ('COMPLETED', 'CANCELED') and closed_at is not null) or (state not in ('COMPLETED', 'CANCELED') and closed_at is null)),
    CONSTRAINT ck_issues_kind CHECK (kind in ('EPIC', 'STORY', 'TASK', 'BUG')),
    CONSTRAINT ck_issues_parent_not_self CHECK (parent_id <> id),
    CONSTRAINT ck_issues_state CHECK (state in ('BACKLOG', 'UNSTARTED', 'STARTED', 'COMPLETED', 'CANCELED')),
    CONSTRAINT ck_issues_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE pending_uploads (
    id uuid NOT NULL,
    storage_key varchar(512) NOT NULL,
    slot varchar(32) NOT NULL,
    file_name varchar(255) NOT NULL,
    content_type varchar(100) NOT NULL,
    issued_by uuid NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE projects (
    id varchar(12) NOT NULL,
    owner_id uuid NOT NULL,
    name varchar(100) NOT NULL,
    key varchar(10) NOT NULL,
    next_number integer DEFAULT 1 NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    CONSTRAINT ck_projects_key_not_blank CHECK (btrim(key) <> ''),
    CONSTRAINT ck_projects_next_number CHECK (next_number >= 1)
);

CREATE TABLE push_delivery_failures (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    endpoint varchar(1000) NOT NULL,
    task_id uuid,
    reason varchar(20) NOT NULL,
    detail varchar(500),
    occurred_at timestamptz NOT NULL,
    resolved_at timestamptz
);

CREATE TABLE push_subscriptions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    endpoint varchar(1000) NOT NULL,
    p256dh varchar(255) NOT NULL,
    auth varchar(255) NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE sent_reminders (
    task_id uuid NOT NULL,
    remind_at timestamp NOT NULL,
    sent_at timestamptz NOT NULL
);

CREATE TABLE sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_hash varchar(64) NOT NULL,
    expires_at timestamptz NOT NULL,
    last_used_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL
);

CREATE TABLE tasks (
    id uuid NOT NULL,
    title varchar(200) NOT NULL,
    note text DEFAULT '' NOT NULL,
    due_date date,
    remind_at timestamp,
    important boolean DEFAULT false NOT NULL,
    my_day_on date,
    completed_at timestamptz,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    user_id uuid NOT NULL,
    CONSTRAINT tasks_title_not_blank CHECK (btrim(title) <> '')
);

CREATE TABLE users (
    id uuid NOT NULL,
    email varchar(320) NOT NULL,
    email_normalized varchar(320) NOT NULL,
    nickname varchar(30) NOT NULL,
    created_at timestamptz NOT NULL,
    updated_at timestamptz NOT NULL,
    role varchar(20) DEFAULT 'USER' NOT NULL
);

CREATE TABLE verification_codes (
    id uuid NOT NULL,
    purpose varchar(20) NOT NULL,
    email_normalized varchar(320) NOT NULL,
    code_hash varchar(64) NOT NULL,
    signup_password_hash varchar(100),
    signup_nickname varchar(30),
    attempts integer NOT NULL,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_verification_codes_signup_password CHECK ((purpose = 'SIGNUP' and signup_password_hash is not null) or (purpose <> 'SIGNUP' and signup_password_hash is null))
);

ALTER TABLE accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);

ALTER TABLE api_tokens
    ADD CONSTRAINT api_tokens_pkey PRIMARY KEY (id);

ALTER TABLE attachments
    ADD CONSTRAINT attachments_pkey PRIMARY KEY (id);

ALTER TABLE blobs
    ADD CONSTRAINT blobs_pkey PRIMARY KEY (id);

ALTER TABLE artifact_folders
    ADD CONSTRAINT artifact_folders_pkey PRIMARY KEY (id);

ALTER TABLE artifact_revisions
    ADD CONSTRAINT artifact_revisions_pkey PRIMARY KEY (id);

ALTER TABLE artifacts
    ADD CONSTRAINT artifacts_pkey PRIMARY KEY (id);

ALTER TABLE issues
    ADD CONSTRAINT issues_pkey PRIMARY KEY (id);

ALTER TABLE pending_uploads
    ADD CONSTRAINT pending_uploads_pkey PRIMARY KEY (id);

ALTER TABLE projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);

ALTER TABLE push_delivery_failures
    ADD CONSTRAINT push_delivery_failures_pkey PRIMARY KEY (id);

ALTER TABLE push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);

ALTER TABLE sent_reminders
    ADD CONSTRAINT sent_reminders_pkey PRIMARY KEY (task_id);

ALTER TABLE sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);

ALTER TABLE tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);

ALTER TABLE accounts
    ADD CONSTRAINT uq_accounts_provider_account UNIQUE (provider, provider_account_id);

ALTER TABLE accounts
    ADD CONSTRAINT uq_accounts_user_provider UNIQUE (user_id, provider);

ALTER TABLE api_tokens
    ADD CONSTRAINT uq_api_tokens_token_hash UNIQUE (token_hash);

ALTER TABLE api_tokens
    ADD CONSTRAINT uq_api_tokens_user UNIQUE (user_id);

ALTER TABLE blobs
    ADD CONSTRAINT uq_blobs_storage_key UNIQUE (storage_key);

ALTER TABLE artifact_revisions
    ADD CONSTRAINT uq_artifact_revisions_artifact_no UNIQUE (artifact_id, revision_no);

ALTER TABLE issues
    ADD CONSTRAINT uq_issues_project_number UNIQUE (project_id, number);

ALTER TABLE pending_uploads
    ADD CONSTRAINT uq_pending_uploads_storage_key UNIQUE (storage_key);


ALTER TABLE push_subscriptions
    ADD CONSTRAINT uq_push_subscriptions_endpoint UNIQUE (endpoint);

ALTER TABLE sessions
    ADD CONSTRAINT uq_sessions_token_hash UNIQUE (token_hash);

ALTER TABLE users
    ADD CONSTRAINT uq_users_email_normalized UNIQUE (email_normalized);

ALTER TABLE verification_codes
    ADD CONSTRAINT uq_verification_codes_email_purpose UNIQUE (email_normalized, purpose);

ALTER TABLE users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);

ALTER TABLE verification_codes
    ADD CONSTRAINT verification_codes_pkey PRIMARY KEY (id);

CREATE INDEX ix_accounts_user_id ON accounts (user_id);

CREATE INDEX ix_attachments_owner ON attachments (owner_type, owner_id, name);

CREATE INDEX ix_artifact_folders_parent_id ON artifact_folders (parent_id);

CREATE INDEX ix_artifact_folders_project_id ON artifact_folders (project_id);

CREATE INDEX ix_artifact_revisions_artifact_no ON artifact_revisions (artifact_id, revision_no DESC);

CREATE INDEX ix_artifacts_folder_id ON artifacts (folder_id);

CREATE INDEX ix_artifacts_project_id ON artifacts (project_id);

CREATE INDEX ix_issues_parent_id ON issues (parent_id);

CREATE INDEX ix_issues_project_ordinal ON issues (project_id, ordinal);

CREATE INDEX ix_issues_project_state ON issues (project_id, state);

CREATE INDEX ix_pending_uploads_created_at ON pending_uploads (created_at);

CREATE INDEX ix_projects_owner_id ON projects (owner_id);

CREATE INDEX ix_push_delivery_failures_occurred_at ON push_delivery_failures (occurred_at DESC);

CREATE INDEX ix_push_delivery_failures_user_id ON push_delivery_failures (user_id);

CREATE INDEX ix_push_subscriptions_user_id ON push_subscriptions (user_id);

CREATE INDEX ix_sessions_expires_at ON sessions (expires_at);

CREATE INDEX ix_sessions_user_id ON sessions (user_id);

CREATE INDEX ix_tasks_user_id ON tasks (user_id);

CREATE INDEX ix_verification_codes_expires_at ON verification_codes (expires_at);

ALTER TABLE accounts
    ADD CONSTRAINT fk_accounts_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE api_tokens
    ADD CONSTRAINT fk_api_tokens_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE attachments
    ADD CONSTRAINT fk_attachments_blob FOREIGN KEY (blob_id) REFERENCES blobs(id) ON DELETE CASCADE;

ALTER TABLE artifact_folders
    ADD CONSTRAINT fk_artifact_folders_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE artifact_folders
    ADD CONSTRAINT fk_artifact_folders_parent FOREIGN KEY (parent_id) REFERENCES artifact_folders(id);

ALTER TABLE artifact_folders
    ADD CONSTRAINT fk_artifact_folders_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE artifact_folders
    ADD CONSTRAINT fk_artifact_folders_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE artifact_revisions
    ADD CONSTRAINT fk_artifact_revisions_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE artifact_revisions
    ADD CONSTRAINT fk_artifact_revisions_artifact FOREIGN KEY (artifact_id) REFERENCES artifacts(id) ON DELETE CASCADE;

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_deleted_by FOREIGN KEY (deleted_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_folder FOREIGN KEY (folder_id) REFERENCES artifact_folders(id);

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_head FOREIGN KEY (head_revision_id) REFERENCES artifact_revisions(id);

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE artifacts
    ADD CONSTRAINT fk_artifacts_updated_by FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE issues
    ADD CONSTRAINT fk_issues_author FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE issues
    ADD CONSTRAINT fk_issues_parent FOREIGN KEY (parent_id) REFERENCES issues(id) ON DELETE SET NULL;

ALTER TABLE issues
    ADD CONSTRAINT fk_issues_project FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;

ALTER TABLE projects
    ADD CONSTRAINT fk_projects_owner FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE push_delivery_failures
    ADD CONSTRAINT fk_push_delivery_failures_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL;

ALTER TABLE push_delivery_failures
    ADD CONSTRAINT fk_push_delivery_failures_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE push_subscriptions
    ADD CONSTRAINT fk_push_subscriptions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE sent_reminders
    ADD CONSTRAINT fk_sent_reminders_task FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE;

ALTER TABLE sessions
    ADD CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE tasks
    ADD CONSTRAINT fk_tasks_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
CREATE TABLE artifact_comments (
    id varchar(12) PRIMARY KEY,
    revision_id uuid NOT NULL REFERENCES artifact_revisions(id) ON DELETE CASCADE,
    block_start integer,
    block_end integer,
    body varchar(5000) NOT NULL,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    CONSTRAINT ck_artifact_comments_range CHECK (
        (block_start IS NULL AND block_end IS NULL) OR
        (block_start IS NOT NULL AND block_end IS NOT NULL AND block_start >= 0 AND block_end > block_start)
    ),
    CONSTRAINT ck_artifact_comments_body CHECK (btrim(body) <> '')
);
CREATE INDEX ix_artifact_comments_revision ON artifact_comments(revision_id, created_at, id);

ALTER TABLE artifacts ADD CONSTRAINT fk_artifacts_owner FOREIGN KEY (owner_id) REFERENCES users(id);
CREATE INDEX ix_artifacts_owner ON artifacts(owner_id);

ALTER TABLE artifact_folders ADD CONSTRAINT fk_artifact_folders_owner FOREIGN KEY (owner_id) REFERENCES users(id);
CREATE INDEX ix_artifact_folders_owner ON artifact_folders(owner_id);

CREATE TABLE project_members (
    project_id varchar(12) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role varchar(10) NOT NULL CHECK (role IN ('editor', 'viewer')),
    joined_at timestamptz NOT NULL,
    PRIMARY KEY (project_id, user_id)
);
CREATE INDEX ix_project_members_user ON project_members(user_id);

CREATE TABLE project_invitations (
    id varchar(12) PRIMARY KEY,
    project_id varchar(12) NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    token varchar(64) NOT NULL UNIQUE,
    label varchar(100) NOT NULL,
    role varchar(10) NOT NULL CHECK (role IN ('editor', 'viewer')),
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamptz NOT NULL,
    expires_at timestamptz NOT NULL,
    revoked boolean NOT NULL DEFAULT false,
    uses integer NOT NULL DEFAULT 0
);
CREATE INDEX ix_project_invitations_project ON project_invitations(project_id);
