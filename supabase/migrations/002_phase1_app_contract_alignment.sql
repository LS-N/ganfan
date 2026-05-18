ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT now();

UPDATE profiles SET created_at = COALESCE(created_at, updated_at, now());

ALTER TABLE profiles
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

ALTER TABLE meals
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'photo',
  ADD COLUMN IF NOT EXISTS photo_path TEXT,
  ADD COLUMN IF NOT EXISTS photo_taken_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS feedback_due_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS draw_card_id UUID,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

ALTER TABLE meals
  ALTER COLUMN ts SET DEFAULT ((EXTRACT(EPOCH FROM now()) * 1000)::BIGINT),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

CREATE INDEX IF NOT EXISTS meals_user_created_idx ON meals(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  dish_name TEXT NOT NULL,
  structure_summary TEXT NOT NULL,
  staple_level TEXT NOT NULL,
  protein_level TEXT NOT NULL,
  vegetable_fiber_level TEXT NOT NULL,
  oil_level TEXT NOT NULL,
  portion_level TEXT NOT NULL,
  risk_hints TEXT[] DEFAULT '{}',
  eating_advice TEXT[] DEFAULT '{}',
  feedback_focus TEXT[] DEFAULT '{}',
  confidence TEXT NOT NULL,
  source TEXT DEFAULT 'ai',
  raw JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analyses_user_created_idx ON analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS analyses_meal_created_idx ON analyses(meal_id, created_at DESC);

CREATE TABLE IF NOT EXISTS analysis_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES analyses(id) ON DELETE SET NULL,
  field TEXT NOT NULL,
  ai_value TEXT,
  user_value TEXT,
  corrected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analysis_corrections_meal_idx ON analysis_corrections(meal_id, corrected_at DESC);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  fullness TEXT NOT NULL,
  comfort TEXT NOT NULL,
  sleepiness TEXT,
  bloating TEXT,
  energy TEXT,
  price_satisfaction TEXT,
  taste_feedback TEXT[] DEFAULT '{}',
  note TEXT,
  submitted_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS feedbacks_user_submitted_idx ON feedbacks(user_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS feedbacks_meal_idx ON feedbacks(meal_id);

CREATE TABLE IF NOT EXISTS body_puzzle_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  sample_size INT NOT NULL,
  patterns JSONB DEFAULT '[]'::jsonb,
  safe_foods TEXT[] DEFAULT '{}',
  risk_combos TEXT[] DEFAULT '{}',
  next_week_suggestion TEXT[] DEFAULT '{}',
  generated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS body_puzzle_reports_user_generated_idx ON body_puzzle_reports(user_id, generated_at DESC);

CREATE TABLE IF NOT EXISTS draw_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  report_id UUID REFERENCES body_puzzle_reports(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  reason TEXT NOT NULL,
  risk TEXT,
  source TEXT NOT NULL,
  action TEXT NOT NULL,
  accepted BOOLEAN,
  decided_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS draw_cards_user_created_idx ON draw_cards(user_id, created_at DESC);

ALTER TABLE analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE body_puzzle_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE draw_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own analyses" ON analyses FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own app corrections" ON analysis_corrections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own feedbacks" ON feedbacks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own reports" ON body_puzzle_reports FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own draw cards" ON draw_cards FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('meal-photos', 'meal-photos', false, 102400, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "users read own meal photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'meal-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "users upload own meal photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "users update own meal photos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'meal-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1])
  WITH CHECK (bucket_id = 'meal-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);

CREATE POLICY "users delete own meal photos" ON storage.objects
  FOR DELETE USING (bucket_id = 'meal-photos' AND auth.uid()::TEXT = (storage.foldername(name))[1]);
