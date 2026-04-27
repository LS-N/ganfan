import type { MealRecord } from "../types/meal"

export const mockMeals: MealRecord[] = []

export function getTodayMockMeals(): MealRecord[] {
  return mockMeals
}
