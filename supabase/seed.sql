INSERT INTO nutrition_items (dish_name, aliases, cuisine, category, nutrition_per_100g, typical_serving_g, data_source)
VALUES
  ('番茄鸡蛋', ARRAY['西红柿炒蛋'], '家常菜', '热菜', '{"calories": 95, "protein_g": 5.5, "fat_g": 6.2, "carb_g": 4.1, "fiber_g": 1.0, "sodium_mg": 220}', 220, 'manual_phase1'),
  ('牛肉饭', ARRAY['牛肉盖饭'], '快餐', '主食', '{"calories": 165, "protein_g": 7.8, "fat_g": 5.4, "carb_g": 21.0, "fiber_g": 1.2, "sodium_mg": 360}', 420, 'manual_phase1')
ON CONFLICT DO NOTHING;
