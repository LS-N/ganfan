from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any


def get_embedding_config() -> dict[str, Any]:
    return {
        "api_key": os.getenv("SILICONFLOW_API_KEY", ""),
        "base_url": os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1").rstrip("/"),
        "model": os.getenv("SILICONFLOW_EMBEDDING_MODEL", "BAAI/bge-m3"),
        "target_dim": int(os.getenv("NUTRITION_EMBEDDING_DIM", "1536")),
    }


def request_embeddings(texts: list[str]) -> list[list[float]]:
    config = get_embedding_config()
    if not config["api_key"]:
        raise RuntimeError("SILICONFLOW_API_KEY is required")
    request = urllib.request.Request(
        f"{config['base_url']}/embeddings",
        data=json.dumps({"model": config["model"], "input": texts}, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {config['api_key']}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=60) as response:
            payload = json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError("embedding_request_failed") from exc
    return [item["embedding"] for item in payload.get("data", [])]


def pad_embedding(values: list[float], target_dim: int | None = None) -> list[float]:
    target = target_dim or get_embedding_config()["target_dim"]
    if len(values) > target:
        return values[:target]
    if len(values) < target:
        return values + [0.0] * (target - len(values))
    return values


def to_pgvector(values: list[float]) -> str:
    return "[" + ",".join(f"{value:.8f}" for value in values) + "]"
