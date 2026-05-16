import type { Analysis, AnalysisCorrection, Feedback, MealRecord, MealSource, MealStatus, MealType } from "../types/meal"
import { mockMealRepository } from "./mockRepositories"
import type { CreateMealInput, MealRepository } from "./repositoryTypes"
import { authService } from "./authService"
import { getSupabaseClient } from "./supabaseClient"

type MealRow = {
  id: string
  user_id: string
  meal_type: MealType
  status: MealStatus
  source: MealSource
  dish: string | null
  cuisine: string | null
  province: string | null
  photo_path: string | null
  photo_taken_at: string | null
  meal_started_at: string | null
  feedback_due_at: string | null
  completed_at: string | null
  draw_card_id: string | null
  created_at: string
  updated_at: string
  analyses?: AnalysisRow[]
  analysis_corrections?: CorrectionRow[]
  feedbacks?: FeedbackRow[]
}

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

type CorrectionRow = {
  id: string
  field: string
  ai_value: string
  user_value: string
  corrected_at: string
}

type FeedbackRow = {
  id: string
  meal_id: string
  fullness: Feedback["fullness"]
  comfort: Feedback["comfort"]
  sleepiness: Feedback["sleepiness"] | null
  bloating: Feedback["bloating"] | null
  energy: Feedback["energy"] | null
  price_satisfaction: Feedback["priceSatisfaction"] | null
  taste_feedback: Feedback["tasteFeedback"] | null
  note: string | null
  submitted_at: string
  created_at: string
}

export function mealFromRow(row: MealRow): MealRecord {
  const analysis = row.analyses?.[0] ? analysisFromRow(row.analyses[0]) : undefined
  const feedback = row.feedbacks?.[0] ? feedbackFromRow(row.feedbacks[0]) : undefined
  return {
    id: row.id,
    userId: row.user_id,
    mealType: row.meal_type,
    status: row.status,
    photoUri: row.photo_path ?? undefined,
    source: row.source,
    cuisine: row.cuisine ?? analysis?.cuisine,
    province: row.province ?? analysis?.province,
    createdAt: row.created_at,
    photoTakenAt: row.photo_taken_at ?? undefined,
    mealStartedAt: row.meal_started_at ?? undefined,
    feedbackDueAt: row.feedback_due_at ?? undefined,
    completedAt: row.completed_at ?? undefined,
    updatedAt: row.updated_at,
    drawCardId: row.draw_card_id ?? undefined,
    analysis,
    analysisId: analysis?.id,
    corrections: row.analysis_corrections?.map(correctionFromRow) ?? [],
    feedback,
    feedbackId: feedback?.id,
    mealTime: row.created_at,
    imageId: row.photo_path ?? undefined,
    mealCategory: row.dish ?? analysis?.dishName ?? "这一餐"
  }
}

export function mealToRow(input: CreateMealInput, userId: string) {
  const now = new Date().toISOString()
  return {
    user_id: userId,
    meal_type: input.mealType ?? "lunch",
    status: "draft" as MealStatus,
    source: input.source ?? "photo",
    dish: input.mealCategory ?? null,
    cuisine: input.cuisine ?? null,
    province: input.province ?? null,
    photo_path: input.photoPath ?? input.photoUri ?? null,
    photo_taken_at: input.photoUri ? now : null,
    meal_started_at: null,
    feedback_due_at: null,
    completed_at: null,
    draw_card_id: input.drawCardId ?? null
  }
}

export function createMealRepository(): MealRepository {
  return {
    async createMeal(input) {
      const client = getSupabaseClient()
      if (!client) return mockMealRepository.createMeal(input)

      const userId = await authService.getUserId()
      const { data, error } = await client.from("meals").insert(mealToRow(input, userId)).select("*").single<MealRow>()
      if (error || !data) throw new Error(error?.message || "meal_create_failed")
      return mealFromRow(data)
    },
    async updateMealStatus(mealId, status) {
      const client = getSupabaseClient()
      if (!client) return mockMealRepository.updateMealStatus(mealId, status)

      const userId = await authService.getUserId()
      const { error } = await client.from("meals").update({ status, updated_at: new Date().toISOString() }).eq("id", mealId).eq("user_id", userId)
      if (error) throw new Error(error.message || "meal_status_update_failed")
    },
    async updateMeal(meal) {
      const client = getSupabaseClient()
      if (!client) return mockMealRepository.updateMeal(meal)

      const userId = await authService.getUserId()
      const { data, error } = await client
        .from("meals")
        .update({
          status: meal.status,
          dish: meal.mealCategory ?? meal.analysis?.dishName ?? null,
          cuisine: meal.cuisine ?? meal.analysis?.cuisine ?? null,
          province: meal.province ?? meal.analysis?.province ?? null,
          photo_path: meal.photoUri ?? null,
          meal_started_at: meal.mealStartedAt ?? null,
          feedback_due_at: meal.feedbackDueAt ?? null,
          completed_at: meal.completedAt ?? null,
          updated_at: new Date().toISOString()
        })
        .eq("id", meal.id)
        .eq("user_id", userId)
        .select("*")
        .single<MealRow>()
      if (error || !data) throw new Error(error?.message || "meal_update_failed")
      return mealFromRow(data)
    },
    async listMeals(userIdInput) {
      const client = getSupabaseClient()
      if (!client) return mockMealRepository.listMeals()

      const userId = userIdInput ?? (await authService.getSessionUserId())
      if (!userId) return []
      const { data, error } = await client
        .from("meals")
        .select("*, analyses(*), analysis_corrections(*), feedbacks(*)")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .returns<MealRow[]>()
      if (error || !data) return []
      return data.map(mealFromRow)
    },
    async getMeal(mealId) {
      const client = getSupabaseClient()
      if (!client) return mockMealRepository.getMeal(mealId)

      const userId = await authService.getSessionUserId()
      if (!userId) return undefined
      const { data, error } = await client
        .from("meals")
        .select("*, analyses(*), analysis_corrections(*), feedbacks(*)")
        .eq("id", mealId)
        .eq("user_id", userId)
        .maybeSingle<MealRow>()
      if (error || !data) return undefined
      return mealFromRow(data)
    }
  }
}

function analysisFromRow(row: AnalysisRow): Analysis {
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
    portionLevel: row.portion_level,
    riskHints: row.risk_hints ?? [],
    eatingAdvice: row.eating_advice ?? [],
    feedbackFocus: row.feedback_focus ?? [],
    confidence: row.confidence,
    source: row.source,
    createdAt: row.created_at,
    oilBurdenLevel,
    lightSuggestions: row.eating_advice ?? []
  }
}

function correctionFromRow(row: CorrectionRow): AnalysisCorrection {
  return {
    id: row.id,
    field: row.field,
    aiValue: row.ai_value,
    userValue: row.user_value,
    correctedAt: row.corrected_at
  }
}

function feedbackFromRow(row: FeedbackRow): Feedback {
  const comfortTag = row.comfort === "uncomfortable" ? "comfortable" : row.comfort
  return {
    id: row.id,
    mealId: row.meal_id,
    fullness: row.fullness,
    comfort: row.comfort,
    sleepiness: row.sleepiness ?? undefined,
    bloating: row.bloating ?? undefined,
    energy: row.energy ?? undefined,
    priceSatisfaction: row.price_satisfaction ?? undefined,
    note: row.note ?? undefined,
    submittedAt: row.submitted_at,
    comfortTags: [comfortTag],
    tasteFeedback: row.taste_feedback ?? [],
    timingStatus: "on_time",
    createdAt: row.created_at
  }
}

export const mealRepository = createMealRepository()
