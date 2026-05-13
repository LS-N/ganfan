import type { Feedback, MealRecord, MealSource, MealType } from "../types/meal"
import { makeMockId, nowIso } from "./mockSeedData"

export type CreateMockMealInput = {
  userId: string
  mealType?: MealType
  source?: MealSource
  photoUri?: string
  mealCategory?: string
  drawCardId?: string
}

export type SaveMockFeedbackInput = Pick<Feedback, "fullness" | "priceSatisfaction" | "tasteFeedback"> & {
  comfortTags: NonNullable<Feedback["comfortTags"]>
  note?: string
}

export const mockMeals: MealRecord[] = []

export function getTodayMockMeals(meals = mockMeals): MealRecord[] {
  const today = new Date().toDateString()
  return meals.filter((meal) => new Date(meal.createdAt).toDateString() === today)
}

export function createMockMeal(input: CreateMockMealInput): MealRecord {
  const id = makeMockId("meal")
  const createdAt = nowIso()

  return {
    id,
    userId: input.userId,
    mealType: input.mealType ?? "lunch",
    status: "photo_ready",
    photoUri: input.photoUri ?? "mock://meal-photo",
    source: input.source ?? "photo",
    createdAt,
    photoTakenAt: createdAt,
    updatedAt: createdAt,
    corrections: [],
    drawCardId: input.drawCardId,
    mealTime: createdAt,
    imageId: "mock-meal-photo",
    mealCategory: input.mealCategory ?? "外卖午餐"
  }
}

export function attachAnalysisToMeal(meal: MealRecord, analysisId: string): MealRecord {
  return {
    ...meal,
    analysisId,
    status: "analyzed",
    updatedAt: nowIso()
  }
}

export function startMeal(meal: MealRecord): MealRecord {
  const mealStartedAt = nowIso()
  const feedbackDueAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()

  return {
    ...meal,
    status: "eating",
    mealStartedAt,
    feedbackDueAt,
    updatedAt: mealStartedAt
  }
}

export function createMockFeedback(mealId: string, input: SaveMockFeedbackInput): Feedback {
  const submittedAt = nowIso()
  const primaryComfort = input.comfortTags[0] ?? "comfortable"

  return {
    id: makeMockId("feedback"),
    mealId,
    fullness: input.fullness,
    comfort: primaryComfort,
    sleepiness: input.comfortTags.includes("sleepy") ? "obvious" : "none",
    bloating: input.comfortTags.includes("bloated") ? "mild" : "none",
    energy: input.comfortTags.includes("energetic") ? "better" : "stable",
    priceSatisfaction: input.priceSatisfaction,
    note: input.note,
    submittedAt,
    comfortTags: input.comfortTags,
    tasteFeedback: input.tasteFeedback,
    timingStatus: "on_time",
    createdAt: submittedAt
  }
}

export function attachFeedbackToMeal(meal: MealRecord, feedbackId: string): MealRecord {
  const completedAt = nowIso()

  return {
    ...meal,
    feedbackId,
    status: "feedback_completed",
    completedAt,
    updatedAt: completedAt
  }
}
