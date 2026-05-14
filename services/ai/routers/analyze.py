from pydantic import BaseModel, Field
from fastapi import APIRouter
from nutrition.catalog import search_catalog

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
    # Phase 1 keeps the service boundary real while the provider can run in mock mode
    # until production AI keys are injected into the backend environment.
    return {
        "dishName": "这一餐",
        "structureSummary": "已收到餐图，当前使用后端 mock provider 输出结构化结果。",
        "stapleLevel": "medium",
        "proteinLevel": "medium",
        "vegetableFiberLevel": "low",
        "oilLevel": "medium",
        "portionLevel": "medium",
        "nutrition": {
            "calories": 650,
            "protein_g": 28,
            "fat_g": 22,
            "carb_g": 78,
            "fiber_g": 5,
            "sodium_mg": 980,
        },
        "nutrition_source": "ai_estimate",
        "matched_nutrition_id": None,
        "match_confidence": None,
        "riskHints": ["蔬菜纤维可能偏少"],
        "eatingAdvice": ["先吃蛋白和蔬菜，再吃主食。", "吃完后记录饱腹和消化感受。"],
        "feedbackFocus": ["饭后 1 小时是否困倦", "有没有胀气或太撑"],
        "confidence": "low",
        "imageQualityNote": "mock provider 不做真实图像识别，只验证服务边界和数据结构。",
    }


@router.get("/nutrition/search")
def search_nutrition(q: str) -> dict:
    return search_catalog(q, limit=5)
