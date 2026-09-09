ALTER TABLE notes ADD COLUMN archived boolean NOT NULL DEFAULT false;
CREATE TABLE note_tags (
    note_id varchar(12) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    tag varchar(40) NOT NULL,
    PRIMARY KEY (note_id, tag)
);
CREATE INDEX ix_note_tags_tag ON note_tags(tag, note_id);
CREATE TABLE task_notes (
    task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    note_id varchar(12) NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
    PRIMARY KEY (task_id, note_id)
);
CREATE INDEX ix_task_notes_note ON task_notes(note_id);
