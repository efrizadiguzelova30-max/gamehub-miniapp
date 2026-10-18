CREATE TABLE IF NOT EXISTS managed_groups (
  chat_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  added_by TEXT NOT NULL,
  created_at TEXT NOT NULL
);
