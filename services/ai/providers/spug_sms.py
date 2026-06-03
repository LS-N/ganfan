from __future__ import annotations

import json
import os
import re
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


def get_spug_sms_config() -> dict[str, str]:
    return {
        "send_url": os.getenv("SPUG_SMS_SEND_URL", ""),
        "method": os.getenv("SPUG_SMS_METHOD", "POST").upper(),
        "app_name": os.getenv("SPUG_SMS_APP_NAME", "干饭"),
        "target_param": os.getenv("SPUG_SMS_TARGET_PARAM", "targets"),
        "code_param": os.getenv("SPUG_SMS_CODE_PARAM", "code"),
        "name_param": os.getenv("SPUG_SMS_NAME_PARAM", "name"),
        "timeout_seconds": os.getenv("SPUG_SMS_TIMEOUT_SECONDS", "4"),
        "strip_cn_code": os.getenv("SPUG_SMS_STRIP_CN_CODE", "true").lower(),
    }


def is_spug_sms_configured() -> bool:
    return bool(get_spug_sms_config()["send_url"])


def send_spug_otp_sms(phone: str, otp: str) -> None:
    config = get_spug_sms_config()
    if not config["send_url"]:
        raise RuntimeError("spug_sms_not_configured")
    if not phone or not otp:
        raise RuntimeError("spug_sms_missing_phone_or_otp")

    payload = {
        config["name_param"]: config["app_name"],
        config["code_param"]: otp,
        config["target_param"]: normalize_phone_for_spug(phone, config["strip_cn_code"] == "true"),
    }
    timeout_seconds = int(config["timeout_seconds"])

    if config["method"] == "GET":
        _send_get(config["send_url"], payload, timeout_seconds)
        return

    _send_post(config["send_url"], payload, timeout_seconds)


def normalize_phone_for_spug(phone: str, strip_cn_code: bool) -> str:
    value = re.sub(r"[^\d+]", "", phone.strip())
    if strip_cn_code and value.startswith("+86") and len(value) == 14:
        return value[3:]
    if strip_cn_code and value.startswith("86") and len(value) == 13:
        return value[2:]
    if strip_cn_code and value.startswith("0086") and len(value) == 15:
        return value[4:]
    return value


def _send_post(url: str, payload: dict[str, Any], timeout_seconds: int) -> None:
    request = urllib.request.Request(
        url,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    _open_spug_request(request, timeout_seconds)


def _send_get(url: str, payload: dict[str, Any], timeout_seconds: int) -> None:
    separator = "&" if urllib.parse.urlparse(url).query else "?"
    query = urllib.parse.urlencode(payload)
    request = urllib.request.Request(f"{url}{separator}{query}", method="GET")
    _open_spug_request(request, timeout_seconds)


def _open_spug_request(request: urllib.request.Request, timeout_seconds: int) -> None:
    try:
        with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
            if response.status < 200 or response.status >= 300:
                raise RuntimeError("spug_sms_request_failed")
    except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError) as exc:
        raise RuntimeError("spug_sms_request_failed") from exc
