CREATE TABLE IF NOT EXISTS profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  age INT,
  gender TEXT,
  height_cm NUMERIC,
  goal TEXT DEFAULT '越来越舒服',
  health_background TEXT[] DEFAULT '{}',
  avoid TEXT,
  feeling TEXT,
  reminder_delay_min INT,
  age_range TEXT,
  weight_kg NUMERIC,
  budget_level TEXT,
  avoidances TEXT[] DEFAULT '{}',
  taste_preferences TEXT[] DEFAULT '{}',
  common_feelings TEXT[] DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS weight_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  value_kg NUMERIC NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ts BIGINT NOT NULL,
  meal_type TEXT NOT NULL,
  dish TEXT,
  cuisine TEXT,
  province TEXT,
  mood TEXT,
  meal_started_at BIGINT,
  meal_duration_ms BIGINT,
  from_card JSONB,
  additionals JSONB,
  daily_checkin_id UUID,
  auto_closed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_analysis (
  meal_id UUID PRIMARY KEY REFERENCES meals(id) ON DELETE CASCADE,
  dish TEXT,
  nutrition JSONB,
  tags TEXT[],
  risk TEXT,
  recognized_foods JSONB,
  eating_advice JSONB,
  analysis_meta JSONB,
  source TEXT DEFAULT 'ai',
  nutrition_source TEXT DEFAULT 'ai_estimate',
  matched_nutrition_id UUID REFERENCES nutrition_items(id),
  match_confidence NUMERIC
);

CREATE TABLE IF NOT EXISTS meal_corrections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  ai_value TEXT,
  user_value TEXT,
  corrected_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_feedback (
  meal_id UUID PRIMARY KEY REFERENCES meals(id) ON DELETE CASCADE,
  actual_intake TEXT,
  intake_ratio NUMERIC,
  fullness TEXT,
  comfort TEXT,
  satisfaction TEXT,
  reactions JSONB,
  submitted_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS meal_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_id UUID REFERENCES meals(id) ON DELETE CASCADE,
  image_type TEXT NOT NULL,
  storage_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_ids UUID[],
  due_at BIGINT,
  is_next_day BOOLEAN DEFAULT false,
  energy TEXT,
  digestion TEXT,
  satiety TEXT,
  answered_at TIMESTAMPTZ,
  dismissed BOOLEAN DEFAULT false,
  UNIQUE(user_id, date)
);

CREATE TABLE IF NOT EXISTS card_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  dish TEXT,
  badge TEXT,
  risk TEXT,
  action TEXT NOT NULL,
  ts BIGINT NOT NULL
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE weight_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_corrections ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE meal_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users own profile" ON profiles FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own weights" ON weight_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own meals" ON meals FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own checkins" ON daily_checkins FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "users own card actions" ON card_actions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users own meal analysis" ON meal_analysis
  FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_analysis.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_analysis.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "users own corrections" ON meal_corrections
  FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_corrections.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_corrections.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "users own feedback" ON meal_feedback
  FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_feedback.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_feedback.meal_id AND meals.user_id = auth.uid()));

CREATE POLICY "users own images" ON meal_images
  FOR ALL USING (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_images.meal_id AND meals.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM meals WHERE meals.id = meal_images.meal_id AND meals.user_id = auth.uid()));
