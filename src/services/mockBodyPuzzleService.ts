import type { BodyPuzzlePattern, Feedback, MealRecord, Report } from "../types/meal"
import { buildMockDrawCards } from "./mockDrawCardService"
import { makeMockId, mockUserId, nowIso } from "./mockSeedData"

export function buildMockBodyPuzzleReport(meals: MealRecord[], feedbacks: Feedback[]): Report {
  const endDate = new Date()
  const startDate = new Date(endDate)
  startDate.setDate(endDate.getDate() - 6)

  const sampleSize = feedbacks.length
  const status = sampleSize === 0 ? "no_data" : sampleSize < 3 ? "warming_up" : sampleSize < 7 ? "first_signal" : "weekly_report"
  const patterns = buildPatterns(feedbacks)
  const drawCards = buildMockDrawCards(meals, feedbacks)

  return {
    id: makeMockId("report"),
    userId: mockUserId,
    status,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    sampleSize,
    patterns,
    safeFoods: ["牛肉饭加青菜，米饭吃 2/3", "清汤麻辣烫，少油不加粉", "口味反馈更偏向清爽、不太咸的餐"],
    riskCombos: ["炸物盖饭 + 含糖饮料", "大份主食 + 浓汤拌饭"],
    nextWeekSuggestion: ["午餐优先选蛋白质足、主食适中、少油的组合。", "如果已经选了重油餐，把饮料换成无糖茶。"],
    drawCards,
    generatedAt: nowIso(),
    effectiveMealCount: Math.max(sampleSize, meals.filter((meal) => meal.feedbackId).length),
    riskCombinations: ["炸物盖饭 + 含糖饮料", "大份主食 + 浓汤拌饭"],
    nextWeekSuggestions: ["午餐优先选蛋白质足、主食适中、少油的组合。", "如果已经选了重油餐，把饮料换成无糖茶。"],
    drawCardRules: drawCards,
    createdAt: nowIso()
  }
}

function buildPatterns(feedbacks: Feedback[]): BodyPuzzlePattern[] {
  const sleepyCount = feedbacks.filter((feedback) => feedback.comfortTags?.includes("sleepy") || feedback.comfort === "sleepy").length
  const justRightCount = feedbacks.filter((feedback) => feedback.fullness === "just_right").length

  return [
    {
      id: "pattern-sleepy-heavy",
      title: "午后困倦线索",
      evidence: sleepyCount > 0 ? `${sleepyCount} 次反馈提到困倦，优先观察重油和大份主食组合。` : "暂时没有明显困倦反馈，继续收集样本。",
      confidence: feedbacks.length >= 7 ? "strong" : feedbacks.length >= 3 ? "medium" : "early"
    },
    {
      id: "pattern-portion",
      title: "饱腹刚好线索",
      evidence: `${justRightCount} 次反馈接近“刚好”，可作为下周安全餐参考。`,
      confidence: feedbacks.length >= 7 ? "strong" : "early"
    }
  ]
}
