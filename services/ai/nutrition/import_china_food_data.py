from __future__ import annotations

import argparse
import json
import re
import subprocess
import tempfile
from pathlib import Path
from typing import Any


DEFAULT_REPO = "https://github.com/Sanotsu/china-food-composition-data.git"
PREFERRED_JSON_DIR = "json_data_vision_251206_Qwen2-5-VL-72B-Instruct"


def parse_number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text in {"-", "--", "..."}:
        return None
    if text.lower() == "tr":
        return 0.0
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group(0)) if match else None


def sql_literal(value: str | None) -> str:
    if value is None:
        return "NULL"
    return "'" + value.replace("'", "''") + "'"


def sql_text_array(values: list[str]) -> str:
    if not values:
        return "'{}'"
    escaped = [value.replace("\\", "\\\\").replace('"', '\\"') for value in values]
    return "'{" + ",".join(f'"{value}"' for value in escaped) + "}'"


def clean_name(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def alias_from_name(name: str) -> list[str]:
    base = re.sub(r"\s*[（(].*?[）)]\s*", "", name).strip()
    return [base] if base and base != name else []


def nutrition_from_row(row: dict[str, Any]) -> dict[str, Any]:
    nutrition = {
        "calories": parse_number(row.get("energyKCal")),
        "protein_g": parse_number(row.get("protein")),
        "fat_g": parse_number(row.get("fat")),
        "carb_g": parse_number(row.get("CHO")),
        "fiber_g": parse_number(row.get("dietaryFiber")),
        "sodium_mg": parse_number(row.get("Na")),
        "source_food_code": clean_name(row.get("foodCode")),
        "edible_percent": parse_number(row.get("edible")),
    }
    return {key: value for key, value in nutrition.items() if value not in (None, "")}


def category_from_file(path: Path) -> str:
    stem = path.stem
    if stem.startswith("merged-"):
        stem = stem[len("merged-") :]
    return stem


def ensure_source_dir(source_dir: Path, repo_url: str) -> Path:
    if source_dir.exists():
        return source_dir
    source_dir.parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "clone", "--depth", "1", repo_url, str(source_dir)], check=True)
    return source_dir


def find_json_dir(source_dir: Path, preferred: str) -> Path:
    candidates = [source_dir / preferred, source_dir / "json_data", source_dir]
    for candidate in candidates:
        if candidate.exists() and any(candidate.glob("*.json")):
            return candidate
    raise FileNotFoundError(f"No nutrition JSON files found under {source_dir}")


def iter_rows(json_dir: Path) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for json_file in sorted(json_dir.glob("*.json")):
        payload = json.loads(json_file.read_text(encoding="utf-8"))
        if not isinstance(payload, list):
            continue
        category = category_from_file(json_file)
        for item in payload:
            if not isinstance(item, dict):
                continue
            dish_name = clean_name(item.get("foodName"))
            nutrition = nutrition_from_row(item)
            if not dish_name or not nutrition:
                continue
            rows.append(
                {
                    "dish_name": dish_name,
                    "aliases": alias_from_name(dish_name),
                    "category": category,
                    "nutrition_per_100g": nutrition,
                }
            )
    return rows


def render_sql(rows: list[dict[str, Any]]) -> str:
    lines = [
        "-- Generated from Sanotsu/china-food-composition-data.",
        "-- Review source license/copyright before production redistribution.",
        "BEGIN;",
        "DELETE FROM nutrition_items WHERE data_source = 'china_food_composition_data';",
    ]
    for row in rows:
        nutrition_json = json.dumps(row["nutrition_per_100g"], ensure_ascii=False, separators=(",", ":"))
        lines.append(
            "INSERT INTO nutrition_items "
            "(dish_name, aliases, cuisine, category, nutrition_per_100g, typical_serving_g, data_source) "
            "VALUES ("
            f"{sql_literal(row['dish_name'])}, "
            f"{sql_text_array(row['aliases'])}::text[], "
            "NULL, "
            f"{sql_literal(row['category'])}, "
            f"{sql_literal(nutrition_json)}::jsonb, "
            "NULL, "
            "'china_food_composition_data'"
            ");"
        )
    lines.append("COMMIT;")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    default_source = Path(tempfile.gettempdir()) / "china-food-composition-data"
    parser = argparse.ArgumentParser(description="Build Phase 1 nutrition_items seed SQL from China food composition JSON.")
    parser.add_argument("--repo-url", default=DEFAULT_REPO)
    parser.add_argument("--source-dir", type=Path, default=default_source)
    parser.add_argument("--json-dir-name", default=PREFERRED_JSON_DIR)
    parser.add_argument("--output", type=Path, default=Path("supabase/generated/nutrition_items_china_food_seed.sql"))
    args = parser.parse_args()

    source_dir = ensure_source_dir(args.source_dir, args.repo_url)
    json_dir = find_json_dir(source_dir, args.json_dir_name)
    rows = iter_rows(json_dir)
    if len(rows) < 1000:
        raise RuntimeError(f"Expected at least 1000 nutrition rows, got {len(rows)} from {json_dir}")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(render_sql(rows), encoding="utf-8")
    print(f"Wrote {len(rows)} nutrition rows from {json_dir} to {args.output}")


if __name__ == "__main__":
    main()
