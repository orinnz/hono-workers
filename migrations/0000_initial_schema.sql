-- Migration number: 0000 	 2024-03-22T00:00:00.000Z

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Tasks table (for queue processing history)
CREATE TABLE IF NOT EXISTS tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  data TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

-- Image analysis table
CREATE TABLE IF NOT EXISTS image_analysis (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  image_url VARCHAR(512) NOT NULL,
  original_name VARCHAR(256) NOT NULL,
  mime_type TEXT NOT NULL,
  ai_response TEXT NOT NULL,
  prompt_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_image_analysis_created_at ON image_analysis(created_at);
