import type { Analysis, AnalysisCorrection } from "../types/meal"
import { mockAnalysisRepository } from "./mockRepositories"
import type { AnalysisRepository } from "./repositoryTypes"
import { authService } from "./authService"
import { getSupabaseClient } from "./supabaseClient"

type AnalysisRow = {
  id: string
  meal_id: string
  dish_name: string
  structure_summary: string
  staple_level: Analysis["stapleLevel"]
  protein_level: Analysis["proteinLevel"]
  vegetable_fiber_level: Analysis["vegetableFiberLevel"]
  oil_level: Analysis["oilLevel"]
  portion_level: Analysis["portionLevel"]
  risk_hints: string[]
  eating_advice: string[]
  feedback_focus: string[]
  confidence: Analysis["confidence"]
  source: Analysis["source"]
  created_at: string
}

export function analysisToRow(analysis: Analysis, userId: string) {
  return {
    user_id: userId,
    meal_id: analysis.mealId,
    dish_name: analysis.dishName,
    structure_summary: analysis.structureSummary,
    staple_level: analysis.stapleLevel,
    protein_level: analysis.proteinLevel,
    vegetable_fiber_level: analysis.vegetableFiberLevel,
    oil_level: analysis.oilLevel,
    portion_level: analysis.portionLevel,
    risk_hints: analysis.riskHints,
    eating_advice: analysis.eatingAdvice,
    feedback_focus: analysis.feedbackFocus,
    confidence: analysis.confidence,
    source: analysis.source,
    raw: null
  }
}

export function analysisFromRow(row: AnalysisRow): Analysis {
  const oilBurdenLevel = row.oil_level === "heavy" ? "high" : row.oil_level === "light" ? "low" : "medium"
  return {
    id: row.id,
    mealId: row.meal_id,
    dishName: row.dish_name,
    structureSummary: row.structure_summary,
    stapleLevel: row.staple_level,
    proteinLevel: row.protein_level,
    vegetableFiberLevel: row.vegetable_fiber_level,
    oilLevel: row.oil_level,
    oilBurdenLevel,
    portionLevel: row.portion_level,
    riskHints: row.risk_hints ?? [],
    eatingAdvice: row.eating_advice ?? [],
    lightSuggestions: row.eating_advice ?? [],
    feedbackFocus: row.feedback_focus ?? [],
    confidence: row.confidence,
    source: row.source,
    createdAt: row.created_at
  }
}

export function createAnalysisRepository(): AnalysisRepository {
  return {
    async saveAnalysis(input) {
      const client = getSupabaseClient()
      if (!client) return mockAnalysisRepository.saveAnalysis(input)

      const userId = await authService.getUserId()
      const { data, error } = await client.from("analyses").insert(analysisToRow(input, userId)).select("*").single<AnalysisRow>()
      if (error || !data) throw new Error(error?.message || "analysis_save_failed")
      return analysisFromRow(data)
    },
    async saveCorrection(input: AnalysisCorrection & { mealId: string; analysisId?: string }) {
      const client = getSupabaseClient()
      if (!client) return mockAnalysisRepository.saveCorrection(input)

      const userId = await authService.getUserId()
      const { data, error } = await client
        .from("analysis_corrections")
        .insert({
          user_id: userId,
          meal_id: input.mealId,
          analysis_id: input.analysisId ?? null,
          field: input.field,
          ai_value: input.aiValue,
          user_value: input.userValue
        })
        .select("id, field, ai_value, user_value, corrected_at")
        .single<{ id: string; field: string; ai_value: string; user_value: string; corrected_at: string }>()
      if (error || !data) throw new Error(error?.message || "analysis_correction_save_failed")
      return { id: data.id, field: data.field, aiValue: data.ai_value, userValue: data.user_value, correctedAt: data.corrected_at }
    },
    async listAnalyses(userIdInput) {
      const client = getSupabaseClient()
      if (!client) return mockAnalysisRepository.listAnalyses()

      const userId = userIdInput ?? (await authService.getSessionUserId())
      if (!userId) return []
      const { data, error } = await client
        .from("analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<AnalysisRow[]>()
      if (error || !data) return []
      return data.map(analysisFromRow)
    },
    async getAnalysisByMeal(mealId) {
      const client = getSupabaseClient()
      if (!client) return mockAnalysisRepository.getAnalysisByMeal(mealId)

      const userId = await authService.getSessionUserId()
      if (!userId) return undefined
      const { data, error } = await client
        .from("analyses")
        .select("*")
        .eq("meal_id", mealId)
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle<AnalysisRow>()
      if (error || !data) return undefined
      return analysisFromRow(data)
    }
  }
}

export const analysisRepository = createAnalysisRepository()
