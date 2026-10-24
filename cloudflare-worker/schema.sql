-- TECHTIS Cloudflare D1 Serverless Database Schema
-- 100% Free Tier: 5,000,000 read rows/day, 100,000 write rows/day, 5 GB storage
-- Zero file retention: NEVER stores uploaded PDF documents or user byte streams.

-- 1. Anonymous Telemetry & Bandwidth Counter
CREATE TABLE IF NOT EXISTS telemetry (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tool_id TEXT NOT NULL,
    bytes_processed INTEGER DEFAULT 0,
    duration_ms INTEGER DEFAULT 0,
    client_country TEXT DEFAULT 'XX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for instant aggregate queries
CREATE INDEX IF NOT EXISTS idx_telemetry_created ON telemetry(created_at);
CREATE INDEX IF NOT EXISTS idx_telemetry_tool ON telemetry(tool_id);

-- 2. User Feedback & Broken Format Reports
CREATE TABLE IF NOT EXISTS feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rating INTEGER CHECK(rating >= 1 AND rating <= 5),
    tool_id TEXT,
    message TEXT,
    client_country TEXT DEFAULT 'XX',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Anonymous Cross-Device Privacy Log Sync (Optional)
CREATE TABLE IF NOT EXISTS sync_tokens (
    token_id TEXT PRIMARY KEY,
    last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS synced_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token_id TEXT NOT NULL,
    tool_id TEXT NOT NULL,
    tool_name TEXT NOT NULL,
    summary TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(token_id) REFERENCES sync_tokens(token_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_synced_logs_token ON synced_logs(token_id);

-- 4. Free IP Protection & Daily Abuse Preventer
-- Limits each visitor IP to 25 free AI calls per day so 1 user cannot consume all free neurons.
CREATE TABLE IF NOT EXISTS ip_quotas (
    ip_hash TEXT NOT NULL,
    request_date TEXT NOT NULL,
    request_count INTEGER DEFAULT 1,
    PRIMARY KEY (ip_hash, request_date)
);

