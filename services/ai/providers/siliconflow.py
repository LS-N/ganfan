from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.request
from typing import Any

from providers.mock import analyze_meal_mock


REQUIRED_KEYS = {
    "dishName",
    "cuisine",
    "province",
    "structureSummary",
    "stapleLevel",
    "proteinLevel",
    "vegetableFiberLevel",
    "oilLevel",
    "portionLevel",
    "nutrition",
    "riskHints",
    "eatingAdvice",
    "feedbackFocus",
    "confidence",
}


def get_siliconflow_config() -> dict[str, str]:
    return {
        "api_key": os.getenv("SILICONFLOW_API_KEY", ""),
        "base_url": os.getenv("SILICONFLOW_BASE_URL", "https://api.siliconflow.cn/v1").rstrip("/"),
        "vision_model": os.getenv("SILICONFLOW_VISION_MODEL", "Qwen/Qwen3-VL-32B-Instruct"),
        "timeout_seconds": os.getenv("SILICONFLOW_TIMEOUT_SECONDS", "25"),
    }


def is_siliconflow_configured() -> bool:
    return bool(get_siliconflow_config()["api_key"])


def _post_json(url: str, api_key: str, payload: dict[str, Any], timeout_seconds: int) -> dict[str, Any]:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            return json.loads(response.read().decode("utf-8"))
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, json.JSONDecodeError) as exc:
        raise RuntimeError("siliconflow_request_failed") from exc


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?", "", cleaned).strip()
        cleaned = re.sub(r"```$", "", cleaned).strip()
    try:
        payload = json.loads(cleaned)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", cleaned, flags=re.S)
        if not match:
            raise
        payload = json.loads(match.group(0))
    if not isinstance(payload, dict):
        raise ValueError("analysis_payload_must_be_object")
    return payload


def _normalize_level(value: Any, default: str = "medium") -> str:
    if value in {"low", "medium", "high", "light", "heavy"}:
        return value
    if value in {"少", "偏少", "低"}:
        return "low"
    if value in {"多", "偏多", "高", "重"}:
        return "high"
    return default


def _normalize_analysis(payload: dict[str, Any]) -> dict[str, Any]:
    fallback = analyze_meal_mock()
    result = {**fallback, **payload}
    result["stapleLevel"] = _normalize_level(result.get("stapleLevel"))
    result["proteinLevel"] = _normalize_level(result.get("proteinLevel"))
    result["vegetableFiberLevel"] = _normalize_level(result.get("vegetableFiberLevel"), "low")
    result["oilLevel"] = _normalize_level(result.get("oilLevel"))
    result["portionLevel"] = _normalize_level(result.get("portionLevel"))
    if result.get("confidence") not in {"low", "medium", "high"}:
        result["confidence"] = "medium"
    if not isinstance(result.get("nutrition"), dict):
        result["nutrition"] = fallback["nutrition"]
    for key in ["riskHints", "eatingAdvice", "feedbackFocus"]:
        if not isinstance(result.get(key), list):
            result[key] = fallback[key]
    result["nutrition_source"] = result.get("nutrition_source") or "ai_estimate"
    result["matched_nutrition_id"] = result.get("matched_nutrition_id")
    result["match_confidence"] = result.get("match_confidence")
    result["imageQualityNote"] = result.get("imageQualityNote") or "siliconflow vision provider"
    return result


def analyze_meal_with_siliconflow(payload: Any) -> dict[str, Any]:
    config = get_siliconflow_config()
    if not config["api_key"]:
        return analyze_meal_mock()

    prompt = {
        "goal": payload.profileContext.goal,
        "avoidances": payload.profileContext.avoidances,
        "tastePreferences": payload.profileContext.tastePreferences,
        "commonFeelings": payload.profileContext.commonFeelings,
        "mealType": payload.mealType,
        "recentSignals": payload.recentSignals,
    }
    user_text = (
        "你是《干饭》Phase 1 餐图分析服务。只返回 JSON 对象，不要 Markdown，不要解释。"
        "字段必须包含 dishName, structureSummary, stapleLevel, proteinLevel, vegetableFiberLevel, "
        "oilLevel, portionLevel, cuisine, province, nutrition, nutrition_source, matched_nutrition_id, match_confidence, "
        "riskHints, eatingAdvice, feedbackFocus, confidence, imageQualityNote。"
        "level 字段使用 low/medium/high；confidence 使用 low/medium/high；nutrition 使用 calories, "
        "protein_g, fat_g, carb_g, fiber_g, sodium_mg。用户上下文："
        f"{json.dumps(prompt, ensure_ascii=False)}"
    )

    message_content: str | list[dict[str, Any]] = user_text
    if payload.imageUrl:
        message_content = [
            {"type": "text", "text": user_text},
            {"type": "image_url", "image_url": {"url": payload.imageUrl}},
        ]

    response = _post_json(
        f"{config['base_url']}/chat/completions",
        config["api_key"],
        {
            "model": config["vision_model"],
            "messages": [{"role": "user", "content": message_content}],
            "temperature": 0.2,
            "max_tokens": 900,
            "response_format": {"type": "json_object"},
        },
        int(config["timeout_seconds"]),
    )
    content = response.get("choices", [{}])[0].get("message", {}).get("content", "")
    try:
        parsed = _extract_json(content)
    except (json.JSONDecodeError, ValueError) as exc:
        raise RuntimeError("siliconflow_analysis_invalid_json") from exc
    missing = REQUIRED_KEYS.difference(parsed)
    if missing:
        raise RuntimeError("siliconflow_analysis_missing_keys")
    return _normalize_analysis(parsed)
