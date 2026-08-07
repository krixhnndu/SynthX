-- The audit trail is append-only (master prompt section 12).
-- SQLite has no GRANT, so the guarantee is enforced by triggers instead.
-- Run AFTER `alembic upgrade head`, so the table exists:
--
--   sqlite3 backend/data/cip.db < infra/sqlite/audit_append_only.sql

DROP TRIGGER IF EXISTS audit_log_no_update;
DROP TRIGGER IF EXISTS audit_log_no_delete;

CREATE TRIGGER audit_log_no_update
BEFORE UPDATE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;

CREATE TRIGGER audit_log_no_delete
BEFORE DELETE ON audit_log
BEGIN
    SELECT RAISE(ABORT, 'audit_log is append-only');
END;
