import type { Feedback } from "../types/meal"
import { mockFeedbackRepository } from "./mockRepositories"
import type { FeedbackRepository, SaveFeedbackInput } from "./repositoryTypes"
import { authService } from "./authService"
import { getSupabaseClient } from "./supabaseClient"

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

export function feedbackToRow(input: SaveFeedbackInput, userId: string) {
  return {
    user_id: userId,
    meal_id: input.mealId,
    fullness: input.fullness,
    comfort: input.comfort,
    sleepiness: input.sleepiness ?? null,
    bloating: input.bloating ?? null,
    energy: input.energy ?? null,
    price_satisfaction: input.priceSatisfaction ?? null,
    taste_feedback: input.tasteFeedback ?? [],
    note: input.note ?? null
  }
}

export function feedbackFromRow(row: FeedbackRow): Feedback {
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
    tasteFeedback: row.taste_feedback ?? [],
    note: row.note ?? undefined,
    submittedAt: row.submitted_at,
    comfortTags: [comfortTag],
    timingStatus: "on_time",
    createdAt: row.created_at
  }
}

export function createFeedbackRepository(): FeedbackRepository {
  return {
    async saveFeedback(input) {
      const client = getSupabaseClient()
      if (!client) return mockFeedbackRepository.saveFeedback(input)

      const userId = await authService.getUserId()
      const { data, error } = await client.from("feedbacks").insert(feedbackToRow(input, userId)).select("*").single<FeedbackRow>()
      if (error || !data) return mockFeedbackRepository.saveFeedback(input)
      return feedbackFromRow(data)
    },
    async listFeedbacks() {
      const client = getSupabaseClient()
      if (!client) return mockFeedbackRepository.listFeedbacks()

      const userId = await authService.getUserId()
      const { data, error } = await client.from("feedbacks").select("*").eq("user_id", userId).order("submitted_at", { ascending: false }).returns<FeedbackRow[]>()
      if (error || !data) return mockFeedbackRepository.listFeedbacks()
      return data.map(feedbackFromRow)
    }
  }
}

export const feedbackRepository = createFeedbackRepository()
