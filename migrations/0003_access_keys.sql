CREATE TABLE IF NOT EXISTS access_keys (
  key_hash TEXT PRIMARY KEY,
  created_by TEXT NOT NULL,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  revoked_at TEXT,
  used_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_access_keys_created_at ON access_keys(created_at);
CREATE INDEX IF NOT EXISTS idx_access_keys_expires_at ON access_keys(expires_at);
