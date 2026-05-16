import type { AnalysisCorrection, Feedback, MealRecord, Profile } from "../types/meal"
import { inferCuisineFromDish } from "../constants/provinces"

export const mockUserId = "mock-user-001"

export function nowIso() {
  return new Date().toISOString()
}

export function makeMockId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

export function daysAgoIso(days: number, hour = 12) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  date.setHours(hour, 0, 0, 0)
  return date.toISOString()
}

export const mockProfile: Profile = {
  id: mockUserId,
  ageRange: "25_34",
  gender: "unknown",
  heightCm: 172,
  weightKg: 68,
  goal: "stable_energy",
  budgetLevel: "medium",
  avoidances: ["太辣", "太油"],
  tastePreferences: ["清爽", "有肉", "不要太撑"],
  commonFeelings: ["sleepy", "bloated"],
  createdAt: daysAgoIso(7, 9),
  updatedAt: daysAgoIso(0, 9),
  age: 29,
  height: 172,
  weight: 68,
  goalType: "post_meal_energy",
  mealBudgets: {
    breakfast: 15,
    lunch: 35,
    dinner: 45
  },
  avoidFoods: ["太辣", "太油"]
}

export const emptyMealSeed: MealRecord[] = []

export function createMockMealSeed(count: 0 | 3 | 7): MealRecord[] {
  if (count === 0) return emptyMealSeed

  const names = ["牛肉饭加青菜", "炸鸡饭配奶茶", "番茄鸡蛋面", "鸡胸肉沙拉", "清汤麻辣烫", "鱼香肉丝盖饭", "虾仁蔬菜饭"]

  return Array.from({ length: count }, (_, index) => {
    const createdAt = daysAgoIso(count - index - 1, index % 2 === 0 ? 12 : 19)
    const mealId = `seed-meal-${count}-${index + 1}`
    const analysisId = `seed-analysis-${count}-${index + 1}`
    const feedbackId = `seed-feedback-${count}-${index + 1}`
    const heavyMeal = index === 1 || index === 5
    const mealStartedAt = createdAt
    const completedAt = daysAgoIso(count - index - 1, index % 2 === 0 ? 14 : 21)
    const cuisine = inferCuisineFromDish(names[index])

    return {
      id: mealId,
      userId: mockUserId,
      mealType: index % 3 === 0 ? "lunch" : index % 3 === 1 ? "dinner" : "breakfast",
      status: "feedback_completed",
      photoUri: `mock://meal-photo-${index + 1}`,
      source: "photo",
      cuisine: cuisine.cuisine,
      province: cuisine.province,
      createdAt,
      photoTakenAt: createdAt,
      mealStartedAt,
      feedbackDueAt: completedAt,
      completedAt,
      updatedAt: completedAt,
      analysisId,
      feedbackId,
      corrections: createSeedCorrections(mealId, heavyMeal),
      mealTime: createdAt,
      imageId: `mock-meal-photo-${index + 1}`,
      mealCategory: names[index] ?? "模拟餐"
    }
  })
}

export function createSeedFeedbacks(meals: MealRecord[]): Feedback[] {
  return meals.map((meal, index) => {
    const heavyMeal = index === 1 || index === 5
    const submittedAt = meal.completedAt ?? meal.updatedAt
    return {
      id: meal.feedbackId ?? `seed-feedback-${index + 1}`,
      mealId: meal.id,
      fullness: heavyMeal ? "too_full" : "just_right",
      comfort: heavyMeal ? "sleepy" : "energetic",
      sleepiness: heavyMeal ? "obvious" : "none",
      bloating: heavyMeal ? "mild" : "none",
      energy: heavyMeal ? "low" : "stable",
      priceSatisfaction: heavyMeal ? "normal" : "worth_it",
      note: heavyMeal ? "吃完有点困，下一次想少点主食。" : undefined,
      submittedAt,
      comfortTags: heavyMeal ? ["sleepy", "bloated"] : ["comfortable", "energetic"],
      tasteFeedback: heavyMeal ? ["too_oily"] : ["tasty"],
      timingStatus: "on_time",
      createdAt: submittedAt
    }
  })
}

function createSeedCorrections(mealId: string, heavyMeal: boolean): AnalysisCorrection[] {
  if (!heavyMeal) return []

  return [
    {
      id: `seed-correction-${mealId}`,
      field: "portionLevel",
      aiValue: "medium",
      userValue: "high",
      correctedAt: nowIso()
    }
  ]
}
