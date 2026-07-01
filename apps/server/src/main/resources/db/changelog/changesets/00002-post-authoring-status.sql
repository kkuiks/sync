--liquibase formatted sql
--changeset skkil:00002-post-authoring-status

ALTER TABLE posts
ADD COLUMN scope VARCHAR(20) NOT NULL DEFAULT 'PUBLIC',
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'PUBLISHED';

UPDATE posts
SET scope = 'WORKSPACE'
WHERE project_id IS NOT NULL;

CREATE INDEX idx_posts_scope_status ON posts(scope, status);

CREATE INDEX idx_posts_status_created_id ON posts(status, created_at DESC, id DESC);
