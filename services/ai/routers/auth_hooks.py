from __future__ import annotations

import os
from typing import Any

from fastapi import APIRouter, Header, Query
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field
from providers.spug_sms import send_spug_otp_sms

router = APIRouter()


class SupabaseHookUser(BaseModel):
    phone: str | None = None


class SupabaseSmsPayload(BaseModel):
    otp: str | None = None


class SendSmsHookPayload(BaseModel):
    user: SupabaseHookUser
    sms: SupabaseSmsPayload = Field(default_factory=SupabaseSmsPayload)


@router.post("/auth/send-sms-hook")
def send_sms_hook(
    payload: SendSmsHookPayload,
    x_ganfan_hook_token: str | None = Header(default=None),
    token: str | None = Query(default=None),
) -> Response:
    if not _is_authorized(x_ganfan_hook_token, token):
        return _runtime_error(401, "unauthorized_auth_hook")

    try:
        send_spug_otp_sms(payload.user.phone or "", payload.sms.otp or "")
    except RuntimeError:
        return _runtime_error(502, "sms_provider_failed")

    return Response(status_code=200)


def _is_authorized(header_token: str | None, query_token: str | None) -> bool:
    expected = os.getenv("GANFAN_AUTH_HOOK_TOKEN", "")
    if not expected:
        return False
    return header_token == expected or query_token == expected


def _runtime_error(http_code: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=http_code,
        content={"error": {"http_code": http_code, "message": message}},
    )
