--liquibase formatted sql
--changeset skkil:00001-add-post-scope

ALTER TABLE posts ADD COLUMN scope VARCHAR(20);

UPDATE posts
SET scope = CASE
    WHEN project_id IS NULL THEN 'PUBLIC'
    ELSE 'WORKSPACE'
END;

ALTER TABLE posts ALTER COLUMN scope SET DEFAULT 'PUBLIC';

ALTER TABLE posts ALTER COLUMN scope SET NOT NULL;

ALTER TABLE posts
ADD CONSTRAINT chk_posts_scope_project
CHECK (
    (scope = 'PUBLIC' AND project_id IS NULL)
    OR (scope = 'WORKSPACE' AND project_id IS NOT NULL)
);

CREATE INDEX idx_posts_scope_status_created_id ON posts(scope, status, created_at DESC, id DESC);

CREATE INDEX idx_posts_author_status_updated_id ON posts(author_id, status, updated_at DESC, id DESC);
