ALTER TABLE tasks ADD COLUMN scheduled_date date;
ALTER TABLE tasks DROP CONSTRAINT ck_tasks_state;
ALTER TABLE tasks ADD CONSTRAINT ck_tasks_state CHECK (state IN ('TODO', 'PLANNED', 'IN_PROGRESS', 'DONE'));
ALTER TABLE tasks ADD CONSTRAINT ck_tasks_schedule CHECK (scheduled_date IS NULL OR due_date IS NULL OR scheduled_date <= due_date);
CREATE INDEX ix_tasks_schedule ON tasks (scheduled_date, due_date);
