import Database from 'better-sqlite3'
import { mkdirSync, existsSync } from 'fs'
import { dirname } from 'path'

const DB_PATH = process.env.DB_PATH || './data/cineweb.db'

// Ensure data directory exists
const dir = dirname(DB_PATH)
if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

const db = new Database(DB_PATH)

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

// ==================== SCHEMA ====================
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL COLLATE NOCASE,
    email TEXT UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT,
    google_id TEXT UNIQUE,
    avatar TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS watchlist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    category TEXT NOT NULL CHECK(category IN ('watching', 'toWatch', 'watched')),
    title TEXT NOT NULL,
    poster_path TEXT,
    rating REAL,
    year TEXT,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id, media_type)
  );

  CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    rating REAL,
    year TEXT,
    season INTEGER,
    episode INTEGER,
    watch_duration INTEGER DEFAULT 0,
    watched_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id, media_type)
  );

  CREATE TABLE IF NOT EXISTS user_preferences (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    auto_play INTEGER DEFAULT 1,
    preferred_source TEXT DEFAULT 'vidsrccc',
    nsfw_filter INTEGER DEFAULT 1,
    theme TEXT DEFAULT 'dark',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS continue_watching (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    title TEXT NOT NULL,
    poster_path TEXT,
    season INTEGER,
    episode INTEGER,
    progress REAL DEFAULT 0,
    duration REAL DEFAULT 0,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, tmdb_id, media_type)
  );

  -- Indexes for performance
  CREATE INDEX IF NOT EXISTS idx_watchlist_user ON watchlist(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_user ON watch_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_history_watched ON watch_history(watched_at DESC);
  CREATE INDEX IF NOT EXISTS idx_continue_user ON continue_watching(user_id);
  CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
  CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL CHECK(media_type IN ('movie', 'tv')),
    season INTEGER,
    episode INTEGER,
    content TEXT NOT NULL,
    parent_id INTEGER REFERENCES comments(id) ON DELETE CASCADE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_comments_media ON comments(tmdb_id, media_type);
  CREATE INDEX IF NOT EXISTS idx_comments_parent ON comments(parent_id);
  CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
`)

// ==================== MIGRATIONS ====================
// Safe to run on every startup — each is a no-op if already applied
const migrations = [
  // v2.1 — Google OAuth support
  `ALTER TABLE users ADD COLUMN google_id TEXT`,
]
for (const sql of migrations) {
  try { db.exec(sql) } catch (_) { /* column already exists — skip */ }
}
// Unique index on google_id (partial: only non-NULL rows)
try {
  db.exec(`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id) WHERE google_id IS NOT NULL`)
} catch (_) {}

export default db
