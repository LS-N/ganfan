from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from functools import lru_cache
from pathlib import Path
from typing import Any


DEFAULT_MANUAL_ITEMS = [
    {
        "dish_name": "红烧肉",
        "aliases": ["东坡肉", "毛氏红烧肉"],
        "category": "热菜",
        "nutrition_source": "manual_phase1_dish_overlay",
        "nutrition_per_100g": {
            "calories": 395,
            "protein_g": 13.0,
            "fat_g": 35.0,
            "carb_g": 6.0,
            "fiber_g": 0.2,
            "sodium_mg": 520,
        },
    }
]


@dataclass(frozen=True)
class NutritionItem:
    dish_name: str
    aliases: tuple[str, ...]
    category: str | None
    nutrition_source: str
    nutrition_per_100g: dict[str, Any]


def _parse_number(value: Any) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text or text in {"-", "--", "..."}:
        return None
    if text.lower() == "tr":
        return 0.0
    match = re.search(r"-?\d+(?:\.\d+)?", text)
    return float(match.group(0)) if match else None


def _clean_name(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "")).strip()


def _alias_from_name(name: str) -> tuple[str, ...]:
    base = re.sub(r"\s*[（(].*?[）)]\s*", "", name).strip()
    if base and base != name:
        return (base,)
    return ()


def _nutrition_from_row(row: dict[str, Any]) -> dict[str, Any]:
    result = {
        "calories": _parse_number(row.get("energyKCal")),
        "protein_g": _parse_number(row.get("protein")),
        "fat_g": _parse_number(row.get("fat")),
        "carb_g": _parse_number(row.get("CHO")),
        "fiber_g": _parse_number(row.get("dietaryFiber")),
        "sodium_mg": _parse_number(row.get("Na")),
    }
    return {key: value for key, value in result.items() if value is not None}


def _category_from_file(path: Path) -> str | None:
    stem = path.stem
    if stem.startswith("merged-"):
        stem = stem[len("merged-") :]
    return stem or None


def _find_data_dir(root: Path) -> Path | None:
    candidates = [
        root / "json_data_vision_251206_Qwen2-5-VL-72B-Instruct",
        root / "json_data",
        root,
    ]
    for candidate in candidates:
        if candidate.exists() and any(candidate.glob("*.json")):
            return candidate
    return None


def _load_china_food_items(data_root: str | None) -> list[NutritionItem]:
    if not data_root:
        return []

    data_dir = _find_data_dir(Path(data_root))
    if data_dir is None:
        return []

    items: list[NutritionItem] = []
    for json_file in sorted(data_dir.glob("*.json")):
        try:
            rows = json.loads(json_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(rows, list):
            continue

        category = _category_from_file(json_file)
        for row in rows:
            if not isinstance(row, dict):
                continue
            name = _clean_name(row.get("foodName"))
            if not name:
                continue
            nutrition = _nutrition_from_row(row)
            if not nutrition:
                continue
            items.append(
                NutritionItem(
                    dish_name=name,
                    aliases=_alias_from_name(name),
                    category=category,
                    nutrition_source="china_food_composition_data",
                    nutrition_per_100g=nutrition,
                )
            )
    return items


@lru_cache(maxsize=1)
def get_catalog() -> tuple[NutritionItem, ...]:
    data_root = os.getenv("CHINA_FOOD_DATA_DIR") or os.getenv("NUTRITION_DATA_DIR")
    manual = [
        NutritionItem(
            dish_name=item["dish_name"],
            aliases=tuple(item.get("aliases", [])),
            category=item.get("category"),
            nutrition_source=item["nutrition_source"],
            nutrition_per_100g=item["nutrition_per_100g"],
        )
        for item in DEFAULT_MANUAL_ITEMS
    ]
    return tuple(manual + _load_china_food_items(data_root))


def _score_item(item: NutritionItem, query: str) -> float:
    names = (item.dish_name, *item.aliases)
    if any(query == name for name in names):
        return 1.0
    if any(query in name or name in query for name in names):
        return 0.86
    return 0.0


def search_catalog(query: str, limit: int = 5) -> dict[str, Any]:
    normalized = _clean_name(query)
    catalog = get_catalog()
    if not normalized:
        return {"query": query, "source_count": len(catalog), "items": []}

    ranked = []
    for item in catalog:
        score = _score_item(item, normalized)
        if score <= 0:
            continue
        ranked.append((score, item))

    ranked.sort(key=lambda pair: pair[0], reverse=True)
    return {
        "query": query,
        "source_count": len(catalog),
        "items": [
            {
                "dish_name": item.dish_name,
                "aliases": list(item.aliases),
                "score": score,
                "category": item.category,
                "nutrition_source": item.nutrition_source,
                "nutrition_per_100g": item.nutrition_per_100g,
            }
            for score, item in ranked[:limit]
        ],
    }
