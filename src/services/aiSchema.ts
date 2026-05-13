import type { Analysis, AnalysisConfidence, Level, OilLevel } from "../types/meal"
import { makeMockId, nowIso } from "./mockSeedData"

type AiAnalysisJson = {
  dishName?: unknown
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
}

const levelValues: Level[] = ["low", "medium", "high", "unknown"]
const oilValues: OilLevel[] = ["light", "medium", "heavy", "unknown"]
const confidenceValues: AnalysisConfidence[] = ["high", "medium", "low"]
const unsafePatterns = [/医学诊断/g, /一定/g, /必然/g, /精确(?:热量|克数)/g, /长胖/g]

export function parseAiAnalysisJson(value: unknown, mealId: string): Analysis {
  const json = asObject(value)
  const oilLevel = normalizeOil(json.oilLevel)
  const oilBurdenLevel = oilLevel === "heavy" ? "high" : oilLevel === "light" ? "low" : "medium"
  const eatingAdvice = normalizeTextArray(json.eatingAdvice)

  return {
    id: makeMockId("analysis"),
    mealId,
    dishName: sanitizeText(json.dishName, "这一餐"),
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
    createdAt: nowIso()
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
