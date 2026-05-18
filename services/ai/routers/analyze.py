from pydantic import BaseModel, Field
from fastapi import APIRouter
from nutrition.catalog import search_catalog
from providers.mock import analyze_meal_mock
from providers.siliconflow import analyze_meal_with_siliconflow
import os

router = APIRouter()


class ProfileContext(BaseModel):
    goal: str
    avoidances: list[str] = Field(default_factory=list)
    tastePreferences: list[str] = Field(default_factory=list)
    commonFeelings: list[str] = Field(default_factory=list)


class AnalyzeMealRequest(BaseModel):
    userId: str
    mealId: str
    imageUrl: str
    mealType: str
    profileContext: ProfileContext
    recentSignals: list[dict] = Field(default_factory=list)


@router.post("/meal/analyze")
def analyze_meal(payload: AnalyzeMealRequest) -> dict:
    if os.getenv("AI_PROVIDER") == "siliconflow":
        try:
            return analyze_meal_with_siliconflow(payload)
        except RuntimeError:
            fallback = analyze_meal_mock()
            fallback["imageQualityNote"] = "真实 AI provider 暂不可用，已降级为结构化兜底结果。"
            return fallback
    return analyze_meal_mock()


@router.get("/nutrition/search")
def search_nutrition(q: str) -> dict:
    return search_catalog(q, limit=5)
