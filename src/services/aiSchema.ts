import type {
  Analysis,
  AnalysisConfidence,
  EatingAdviceItem,
  Level,
  Nutrition,
  OilLevel,
  RecognizedFood,
  RecommendationStage
} from "../types/meal"
import { inferCuisineFromDish } from "../constants/provinces"
import { makeMockId, nowIso } from "./mockSeedData"

type AiAnalysisJson = {
  dishName?: unknown
  cuisine?: unknown
  province?: unknown
  structureSummary?: unknown
  stapleLevel?: unknown
  proteinLevel?: unknown
  vegetableFiberLevel?: unknown
  oilLevel?: unknown
  portionLevel?: unknown
  riskHints?: unknown
  eatingAdvice?: unknown
  feedbackFocus?: unknown
  confidence?: unknown
  imageQualityNote?: unknown
  // Phase 2+ 字段
  nutrition?: unknown
  tags?: unknown
  adviceStage?: unknown
  recognizedFoods?: unknown
  eatingAdviceItems?: unknown
}

const levelValues: Level[] = ["low", "medium", "high", "unknown"]
const oilValues: OilLevel[] = ["light", "medium", "heavy", "unknown"]
const confidenceValues: AnalysisConfidence[] = ["high", "medium", "low"]
const recommendationStageValues: RecommendationStage[] = [
  "general", "feedback", "body_puzzle", "body_structure", "fulfillment", "food_memory"
]
const unsafePatterns = [/医学诊断/g, /一定/g, /必然/g, /精确(?:热量|克数)/g, /长胖/g]

export function parseAiAnalysisJson(value: unknown, mealId: string): Analysis {
  const json = asObject(value)
  const oilLevel = normalizeOil(json.oilLevel)
  const oilBurdenLevel = oilLevel === "heavy" ? "high" : oilLevel === "light" ? "low" : "medium"
  const eatingAdvice = normalizeTextArray(json.eatingAdvice)
  const dishName = sanitizeText(json.dishName, "这一餐")
  const inferred = inferCuisineFromDish(dishName)

  return {
    id: makeMockId("analysis"),
    mealId,
    dishName,
    cuisine: sanitizeText(json.cuisine, inferred.cuisine),
    province: sanitizeText(json.province, inferred.province),
    structureSummary: sanitizeText(json.structureSummary, "这餐可以做结构参考，结果不代表精确营养计算。"),
    stapleLevel: normalizeLevel(json.stapleLevel),
    proteinLevel: normalizeLevel(json.proteinLevel),
    vegetableFiberLevel: normalizeLevel(json.vegetableFiberLevel),
    oilLevel,
    oilBurdenLevel,
    portionLevel: normalizeLevel(json.portionLevel),
    riskHints: normalizeTextArray(json.riskHints),
    eatingAdvice,
    lightSuggestions: eatingAdvice,
    feedbackFocus: normalizeTextArray(json.feedbackFocus),
    confidence: normalizeConfidence(json.confidence),
    imageQualityNote: sanitizeText(json.imageQualityNote, "结果仅供轻参考。"),
    source: "ai",
    createdAt: nowIso(),
    // Phase 2+ 基础字段
    nutrition: normalizeNutrition(json.nutrition),
    tags: normalizeTagArray(json.tags),
    adviceStage: normalizeAdviceStage(json.adviceStage),
    recognizedFoods: normalizeRecognizedFoods(json.recognizedFoods),
    eatingAdviceItems: normalizeEatingAdviceItems(json.eatingAdviceItems)
  }
}

function asObject(value: unknown): AiAnalysisJson {
  if (typeof value === "string") {
    try {
      return asObject(JSON.parse(value))
    } catch {
      return {}
    }
  }
  if (value && typeof value === "object") return value as AiAnalysisJson
  return {}
}

function normalizeLevel(value: unknown): Level {
  return levelValues.includes(value as Level) ? (value as Level) : "unknown"
}

function normalizeOil(value: unknown): OilLevel {
  return oilValues.includes(value as OilLevel) ? (value as OilLevel) : "unknown"
}

function normalizeConfidence(value: unknown): AnalysisConfidence {
  return confidenceValues.includes(value as AnalysisConfidence) ? (value as AnalysisConfidence) : "low"
}

function normalizeTextArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.slice(0, 5).map((item) => sanitizeText(item, "")).filter(Boolean)
}

function sanitizeText(value: unknown, fallback: string): string {
  const text = typeof value === "string" && value.trim() ? value.trim() : fallback
  return unsafePatterns.reduce((current, pattern) => current.replace(pattern, "可能"), text)
}

function normalizeNutrition(value: unknown): Nutrition | undefined {
  if (!value || typeof value !== "object") return undefined
  const n = value as Record<string, unknown>
  const calories = typeof n.calories === "number" ? n.calories : undefined
  const protein = typeof n.protein === "number" ? n.protein : undefined
  const carbs = typeof n.carbs === "number" ? n.carbs : undefined
  const fat = typeof n.fat === "number" ? n.fat : undefined
  if (calories === undefined && protein === undefined) return undefined
  return {
    calories: calories ?? 0,
    protein: protein ?? 0,
    carbs: carbs ?? 0,
    fat: fat ?? 0
  }
}

const APPROVED_TAGS = new Set([
  "高蛋白", "高碳水", "高脂肪", "高纤维", "轻食", "清淡", "重口", "辛辣",
  "油腻", "甜食", "汤类", "主食", "蔬菜为主", "肉类为主", "海鲜", "发酵食品"
])

function normalizeTagArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined
  const tags = value.filter((t) => typeof t === "string" && APPROVED_TAGS.has(t)) as string[]
  return tags.length > 0 ? tags : undefined
}

function normalizeAdviceStage(value: unknown): RecommendationStage | undefined {
  return recommendationStageValues.includes(value as RecommendationStage)
    ? (value as RecommendationStage)
    : undefined
}

function normalizeRecognizedFoods(value: unknown): RecognizedFood[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value.slice(0, 10).map((item) => {
    const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      name: sanitizeText(obj.name, "未知食材"),
      weight: sanitizeText(obj.weight, "未知克数"),
      confidence: normalizeConfidence(obj.confidence),
      nutritionSource: normalizeNutritionSource(obj.nutritionSource),
      matchedNutritionName: typeof obj.matchedNutritionName === "string" ? obj.matchedNutritionName : undefined,
      matchConfidence: typeof obj.matchConfidence === "number" ? obj.matchConfidence : undefined
    }
  })
}

function normalizeNutritionSource(value: unknown): RecognizedFood["nutritionSource"] {
  const valid = ["nutrition_db", "ai_estimate", "pending"] as const
  return valid.includes(value as (typeof valid)[number]) ? (value as RecognizedFood["nutritionSource"]) : "ai_estimate"
}

function normalizeEatingAdviceItems(value: unknown): EatingAdviceItem[] | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined
  return value.slice(0, 3).map((item) => {
    const obj = item && typeof item === "object" ? (item as Record<string, unknown>) : {}
    return {
      tip: sanitizeText(obj.tip, ""),
      type: (obj.type === "positive" || obj.type === "caution" ? obj.type : "positive") as EatingAdviceItem["type"]
    }
  }).filter((item) => item.tip)
}
