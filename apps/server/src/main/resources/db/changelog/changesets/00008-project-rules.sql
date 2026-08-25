--liquibase formatted sql
--changeset skkil:00008-project-rules
--
ALTER TABLE projects ADD COLUMN rules TEXT;
