# Phase 1 Nutrition Source

Phase 1 can read the user-provided China food composition dataset without vendoring the whole dataset into this repo.

Source:

```text
https://github.com/Sanotsu/china-food-composition-data
```

The upstream README notes OCR/model-recognition accuracy limits and does not provide a clear redistribution license. For product work, treat it as an import source that must be reviewed before production redistribution.

## Local AI service search

Set `CHINA_FOOD_DATA_DIR` to a local clone path before starting FastAPI:

```powershell
$env:CHINA_FOOD_DATA_DIR="$env:TEMP\china-food-composition-data"
uvicorn main:app --reload
```

`GET /v1/nutrition/search?q=鸡` will search the local dataset. A small manual Phase 1 dish overlay covers common dish names such as `红烧肉` / `东坡肉`, because the composition table is ingredient/food oriented rather than prepared-dish oriented.

## Supabase seed generation

Generate an ignored SQL seed file:

```powershell
python services\ai\nutrition\import_china_food_data.py
```

The script clones the dataset to `%TEMP%\china-food-composition-data` if needed and writes:

```text
supabase/generated/nutrition_items_china_food_seed.sql
```

That generated file is intentionally ignored. Review data rights and quality before running it against production Supabase.
