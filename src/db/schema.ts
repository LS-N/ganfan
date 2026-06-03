export const sqliteSchemaStatements = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    age_range TEXT,
    gender TEXT,
    height_cm REAL,
    weight_kg REAL,
    goal TEXT NOT NULL,
    budget_level TEXT,
    avoidances TEXT NOT NULL DEFAULT '[]',
    taste_preferences TEXT NOT NULL DEFAULT '[]',
    common_feelings TEXT NOT NULL DEFAULT '[]',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS weight_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    value_kg REAL NOT NULL,
    recorded_at TEXT NOT NULL
  )`,
  `CREATE INDEX IF NOT EXISTS weight_logs_user_recorded_idx ON weight_logs(user_id, recorded_at DESC)`,
  `CREATE TABLE IF NOT EXISTS meals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    ts INTEGER NOT NULL,
    meal_type TEXT NOT NULL,
    status TEXT NOT NULL,
    dish TEXT,
    cuisine TEXT,
    province TEXT,
    mood TEXT,
    source TEXT NOT NULL,
    photo_uri TEXT,
    meal_started_at TEXT,
    feedback_due_at TEXT,
    completed_at TEXT,
    from_card TEXT,
    additionals TEXT,
    auto_closed_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending',
    remote_id TEXT
  )`,
  `CREATE INDEX IF NOT EXISTS meals_user_created_idx ON meals(user_id, created_at DESC)`,
  `CREATE INDEX IF NOT EXISTS meals_sync_idx ON meals(sync_status, updated_at)`,
  `CREATE TABLE IF NOT EXISTS meal_analysis (
    meal_id TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    dish TEXT,
    nutrition TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    risk TEXT,
    recognized_foods TEXT NOT NULL DEFAULT '[]',
    eating_advice TEXT NOT NULL DEFAULT '[]',
    analysis_meta TEXT NOT NULL DEFAULT '{}',
    source TEXT NOT NULL DEFAULT 'ai',
    nutrition_source TEXT NOT NULL DEFAULT 'ai_estimate',
    matched_nutrition_id TEXT,
    match_confidence REAL,
    created_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE TABLE IF NOT EXISTS meal_corrections (
    id TEXT PRIMARY KEY,
    meal_id TEXT NOT NULL,
    field TEXT NOT NULL,
    ai_value TEXT,
    user_value TEXT,
    corrected_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE TABLE IF NOT EXISTS meal_feedback (
    meal_id TEXT PRIMARY KEY,
    id TEXT NOT NULL,
    actual_intake TEXT,
    intake_ratio REAL,
    fullness TEXT NOT NULL,
    comfort TEXT NOT NULL,
    satisfaction TEXT,
    reactions TEXT NOT NULL DEFAULT '{}',
    submitted_at TEXT NOT NULL,
    created_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE TABLE IF NOT EXISTS meal_images (
    id TEXT PRIMARY KEY,
    meal_id TEXT NOT NULL,
    image_type TEXT NOT NULL,
    local_uri TEXT,
    storage_url TEXT,
    created_at TEXT NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE INDEX IF NOT EXISTS meal_images_meal_idx ON meal_images(meal_id, image_type)`,
  `CREATE TABLE IF NOT EXISTS card_actions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    dish TEXT,
    badge TEXT,
    risk TEXT,
    action TEXT NOT NULL,
    ts INTEGER NOT NULL,
    sync_status TEXT NOT NULL DEFAULT 'pending'
  )`,
  `CREATE TABLE IF NOT EXISTS sync_queue (
    id TEXT PRIMARY KEY,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    operation TEXT NOT NULL,
    payload TEXT NOT NULL,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  )`
]

export const sqliteSchemaVersion = 1
