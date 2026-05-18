# 数据模型

## UserProfile

```ts
type UserProfile = {
  id: string
  nickname?: string
  gender?: "male" | "female" | "unknown"
  height?: number
  weight?: number
  targetWeight?: number
  goalType: "fat_loss" | "maintain" | "muscle_gain"
  dailyCalorieTarget?: number
  createdAt: string
  updatedAt: string
}
```

## MealRecord

```ts
type MealRecord = {
  id: string
  userId: string
  mealType: "breakfast" | "lunch" | "dinner" | "snack"
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
```

## FoodItem

```ts
type FoodItem = {
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
```

## DailyNutritionSummary

```ts
type DailyNutritionSummary = {
  date: string
  targetCalories: number
  totalCalories: number
  remainingCalories: number
  status: "normal" | "warning" | "exceeded"
  meals: MealRecord[]
}
```
