export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export type FoodItem = {
  id: string
  name: string
  amount?: number
  unit?: string
  calories?: number
  protein?: number
  fat?: number
  carbohydrate?: number
  source: "manual" | "ai_text" | "ai_image"
}

export type MealRecord = {
  id: string
  userId: string
  mealType: MealType
  mealTime: string
  foods: FoodItem[]
  totalCalories: number
  protein?: number
  fat?: number
  carbohydrate?: number
  score?: number
  status: "normal" | "warning" | "exceeded"
  aiSummary?: string
  createdAt: string
  updatedAt: string
}
