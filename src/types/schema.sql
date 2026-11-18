-- ==============================================================================
-- POSTGRESQL RELATIONAL DDL (For direct SQL / Supabase / Neon / RDS setup)
-- ==============================================================================

CREATE TYPE habit_category AS ENUM (
  'health', 'code', 'mind', 'fitness', 'deep_work', 'finance', 'reading'
);

CREATE TYPE habit_status AS ENUM (
  'done', 'missed', 'neutral'
);

CREATE TYPE habit_frequency AS ENUM (
  'daily', 'weekdays', 'weekends', 'custom'
);

CREATE TABLE IF NOT EXISTS habits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  category habit_category NOT NULL DEFAULT 'health',
  identity TEXT NOT NULL,
  cue TEXT NOT NULL,
  routine TEXT NOT NULL,
  two_minute_rule TEXT NOT NULL,
  reward TEXT NOT NULL,
  color VARCHAR(32) NOT NULL DEFAULT '#14b8a6',
  icon VARCHAR(64) NOT NULL DEFAULT 'Flame',
  frequency habit_frequency NOT NULL DEFAULT 'daily',
  time_of_day VARCHAR(32) NOT NULL DEFAULT 'anytime',
  target_days_per_week INT NOT NULL DEFAULT 7,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS habit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  habit_id UUID NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  status habit_status NOT NULL DEFAULT 'neutral',
  notes TEXT,
  logged_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_habit_date UNIQUE (habit_id, date)
);

CREATE INDEX IF NOT EXISTS idx_habits_user ON habits(user_id, archived);
CREATE INDEX IF NOT EXISTS idx_habit_logs_date ON habit_logs(date);
CREATE INDEX IF NOT EXISTS idx_habit_logs_lookup ON habit_logs(habit_id, date, status);

-- Trigger to auto-update updated_at on modification
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_habits_updated_at
  BEFORE UPDATE ON habits
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_habit_logs_updated_at
  BEFORE UPDATE ON habit_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
