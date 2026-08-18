--liquibase formatted sql
--changeset skkil:00010-post-recruitments

-- 구인글은 기존 LONG 게시글의 본문, 태그, 댓글, 좋아요, 북마크를 그대로 쓴다.
-- 이 테이블의 행이 존재하는지가 일반 게시글과 구인글을 구분하며, 지원 방법과 보상 조건은
-- 별도 컬럼으로 구조화하지 않고 작성자가 게시글 본문에 적는다.
CREATE TABLE post_recruitments (
    post_id BIGINT PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    employment_type VARCHAR(30) NOT NULL,
    work_mode VARCHAR(20) NOT NULL,
    location VARCHAR(100),
    experience_level VARCHAR(20) NOT NULL,
    closes_at TIMESTAMPTZ,
    FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE,
    CONSTRAINT post_recruitments_status_check
        CHECK (status IN ('OPEN', 'CLOSED')),
    CONSTRAINT post_recruitments_employment_type_check
        CHECK (employment_type IN ('FULL_TIME', 'PART_TIME', 'CONTRACT', 'INTERNSHIP', 'FREELANCE_PROJECT')),
    CONSTRAINT post_recruitments_work_mode_check
        CHECK (work_mode IN ('REMOTE', 'HYBRID', 'ONSITE')),
    CONSTRAINT post_recruitments_experience_level_check
        CHECK (experience_level IN ('ANY', 'ENTRY', 'JUNIOR', 'MID', 'SENIOR'))
);

CREATE INDEX idx_post_recruitments_status_post_id
    ON post_recruitments(status, post_id DESC);
