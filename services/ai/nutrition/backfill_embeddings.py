from __future__ import annotations

import json
import os
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from nutrition.embeddings import pad_embedding, request_embeddings, to_pgvector


BATCH_SIZE = 64


def required_env(name: str) -> str:
    value = os.getenv(name)
    if not value:
        raise RuntimeError(f"{name} is required")
    return value


def request_supabase(method: str, path: str, body: Any | None = None, prefer: str | None = None) -> Any:
    url = required_env("SUPABASE_URL").rstrip("/") + path
    service_role = required_env("SUPABASE_SERVICE_ROLE_KEY")
    data = None if body is None else json.dumps(body, ensure_ascii=False).encode("utf-8")
    headers = {
        "apikey": service_role,
        "authorization": f"Bearer {service_role}",
        "content-type": "application/json",
    }
    if prefer:
        headers["prefer"] = prefer
    request = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload) if payload else None
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8")
        raise RuntimeError(f"supabase_{method}_failed: {exc.code} {detail}") from exc


def fetch_items(limit: int, offset: int) -> list[dict[str, Any]]:
    query = urllib.parse.urlencode(
        {
            "select": "id,dish_name,aliases,category",
            "embedding": "is.null",
            "order": "dish_name.asc",
            "limit": str(limit),
            "offset": str(offset),
        }
    )
    return request_supabase("GET", f"/rest/v1/nutrition_items?{query}") or []


def embedding_text(item: dict[str, Any]) -> str:
    aliases = item.get("aliases") or []
    alias_text = "、".join(aliases[:3]) if isinstance(aliases, list) else ""
    parts = [item.get("dish_name") or "", alias_text, item.get("category") or ""]
    return "；".join(part for part in parts if part)


def update_embedding(item_id: str, vector: list[float]) -> None:
    encoded = urllib.parse.quote(item_id)
    request_supabase(
        "PATCH",
        f"/rest/v1/nutrition_items?id=eq.{encoded}",
        {"embedding": to_pgvector(vector)},
        prefer="return=minimal",
    )


def update_embeddings(rows: list[dict[str, str]]) -> None:
    for row in rows:
        update_embedding(row["id"], row["embedding"])


def main() -> None:
    total = 0
    while True:
        items = fetch_items(BATCH_SIZE, 0)
        if not items:
            break
        vectors = request_embeddings([embedding_text(item) for item in items])
        if len(vectors) != len(items):
            raise RuntimeError("embedding_count_mismatch")
        update_embeddings(
            [
                {"id": item["id"], "embedding": pad_embedding(vector)}
                for item, vector in zip(items, vectors)
            ]
        )
        total += len(items)
        print(json.dumps({"updated": total, "last_batch": len(items)}, ensure_ascii=False), flush=True)
        time.sleep(0.2)
    print(json.dumps({"completed": total}, ensure_ascii=False), flush=True)


if __name__ == "__main__":
    main()
