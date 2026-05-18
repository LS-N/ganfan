CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE IF NOT EXISTS nutrition_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dish_name TEXT NOT NULL,
  aliases TEXT[] DEFAULT '{}',
  cuisine TEXT,
  category TEXT,
  nutrition_per_100g JSONB NOT NULL,
  typical_serving_g INT,
  data_source TEXT,
  embedding vector(1536),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nutrition_embedding_idx
  ON nutrition_items
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS nutrition_dish_name_idx ON nutrition_items (dish_name);
CREATE INDEX IF NOT EXISTS nutrition_aliases_idx ON nutrition_items USING GIN (aliases);
