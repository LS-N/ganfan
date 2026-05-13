import type { Analysis, AnalysisCorrection, Level, MealRecord, OilLevel } from "../types/meal"
import { makeMockId, nowIso } from "./mockSeedData"

export type MockAnalysisMode = "success" | "low_confidence" | "failed"

export function buildMockAnalysis(meal: Pick<MealRecord, "id" | "mealType" | "mealCategory">, mode: MockAnalysisMode = "success"): Analysis {
  if (mode === "failed") {
    throw new Error("Mock analysis failed")
  }

  const lowConfidence = mode === "low_confidence"
  const dishName = meal.mealCategory ?? (meal.mealType === "breakfast" ? "早餐组合" : "外卖餐")
  const oilLevel: OilLevel = dishName.includes("炸") || dishName.includes("盖饭") ? "heavy" : "medium"
  const oilBurdenLevel: Exclude<Level, "unknown"> = oilLevel === "heavy" ? "high" : "medium"

  return {
    id: makeMockId("analysis"),
    mealId: meal.id,
    dishName,
    structureSummary: "这餐主食存在感较强，蛋白质中等，蔬菜纤维偏少。结果用于结构判断，不代表精确营养计算。",
    stapleLevel: "high",
    proteinLevel: "medium",
    vegetableFiberLevel: "low",
    oilLevel,
    oilBurdenLevel,
    portionLevel: "medium",
    riskHints: ["这类主食偏多、油脂偏高的组合，可能让你饭后更容易困，需要饭后反馈验证。"],
    eatingAdvice: ["先吃蛋白和菜，再吃主食。", "米饭可以少吃几口，汤汁少拌饭。"],
    feedbackFocus: ["饭后是否困", "是否胀", "饱腹是否刚好"],
    confidence: lowConfidence ? "low" : "high",
    source: "mock",
    imageQualityNote: lowConfidence ? "图片信息不完整，结果只作轻参考。" : "图片较清楚，结果仅用于结构判断。",
    lightSuggestions: ["先吃蛋白和菜，再吃主食。", "米饭可以少吃几口，汤汁少拌饭。"],
    createdAt: nowIso()
  }
}

export function buildSeedAnalyses(meals: MealRecord[]): Analysis[] {
  return meals.map((meal, index) => {
    const heavyMeal = index === 1 || index === 5
    const oilLevel: OilLevel = heavyMeal ? "heavy" : "medium"
    const oilBurdenLevel: Exclude<Level, "unknown"> = heavyMeal ? "high" : "medium"

    return {
      id: meal.analysisId ?? `seed-analysis-${index + 1}`,
      mealId: meal.id,
      dishName: meal.mealCategory ?? "模拟餐",
      structureSummary: heavyMeal ? "主食和油脂偏高，建议用饭后反馈验证困倦和胀感。" : "蛋白质和蔬菜相对更稳，适合作为后续安全餐参考。",
      stapleLevel: heavyMeal ? "high" : "medium",
      proteinLevel: "medium",
      vegetableFiberLevel: heavyMeal ? "low" : "medium",
      oilLevel,
      oilBurdenLevel,
      portionLevel: heavyMeal ? "high" : "medium",
      riskHints: heavyMeal ? ["油脂和主食都偏高时，饭后困倦概率可能更高。"] : ["当前结构比较稳，但仍需要结合反馈判断。"],
      eatingAdvice: heavyMeal ? ["饮料换无糖茶。", "主食先少吃几口。"] : ["保持蛋白质和蔬菜优先。"],
      feedbackFocus: ["饱腹", "困倦", "胀感"],
      confidence: index === 2 ? "low" : "high",
      source: "mock",
      imageQualityNote: index === 2 ? "模拟低置信度样本。" : "模拟结构分析样本。",
      lightSuggestions: heavyMeal ? ["饮料换无糖茶。", "主食先少吃几口。"] : ["保持蛋白质和蔬菜优先。"],
      createdAt: meal.createdAt
    }
  })
}

export function createAnalysisCorrection(input: { field: string; aiValue: string; userValue: string }): AnalysisCorrection {
  return {
    id: makeMockId("correction"),
    field: input.field,
    aiValue: input.aiValue,
    userValue: input.userValue,
    correctedAt: nowIso()
  }
}
