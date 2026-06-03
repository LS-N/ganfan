import type { AnalysisConfidence, Feedback, MealRecord, RecommendationStage } from "../types/meal"

export const RECOMMENDATION_STAGE_ORDER: RecommendationStage[] = [
  "general",
  "feedback",
  "body_puzzle",
  "body_structure",
  "fulfillment",
  "food_memory"
]

const RECOMMENDATION_STAGE_LABELS: Record<RecommendationStage, string> = {
  general: "通用推荐",
  feedback: "反馈推荐",
  body_puzzle: "身体拼图推荐",
  body_structure: "身体结构推荐",
  fulfillment: "计划履约推荐",
  food_memory: "食材记忆推荐"
}

const RECOMMENDATION_STAGE_UNLOCK_REQUIREMENTS: Record<RecommendationStage, string> = {
  general: "记录第一餐即可开始",
  feedback: "累计 3 餐饭后反馈后启用",
  body_puzzle: "累计 7 餐反馈后启用",
  body_structure: "接入身体信号后启用",
  fulfillment: "接入计划执行与替换记录后启用",
  food_memory: "接入订单、剩余量和食材消耗后启用"
}

export function getRecommendationStageLabel(stage: RecommendationStage) {
  return RECOMMENDATION_STAGE_LABELS[stage]
}

export function getRecommendationStageUnlockRequirement(stage: RecommendationStage) {
  return RECOMMENDATION_STAGE_UNLOCK_REQUIREMENTS[stage]
}

export function getRecommendationStageConfidence(stage: RecommendationStage, feedbackCount: number): AnalysisConfidence {
  if (stage === "body_puzzle") return feedbackCount >= 10 ? "high" : "medium"
  if (stage === "feedback") return feedbackCount >= 5 ? "medium" : "low"
  return "low"
}

export function deriveRecommendationStage(feedbackCount: number): RecommendationStage {
  if (feedbackCount >= 7) return "body_puzzle"
  if (feedbackCount >= 3) return "feedback"
  return "general"
}

export function getPreviousRecommendationStage(stage: RecommendationStage): RecommendationStage {
  const index = RECOMMENDATION_STAGE_ORDER.indexOf(stage)
  return index > 0 ? RECOMMENDATION_STAGE_ORDER[index - 1] : stage
}

export function getRecommendationStageSources(stage: RecommendationStage, meals: MealRecord[], feedbacks: Feedback[]) {
  const sampleSize = feedbacks.length
  const comfortSignals = feedbacks.filter((feedback) => feedback.comfortTags?.includes("comfortable") || feedback.comfort === "comfortable").length
  const sleepySignals = feedbacks.filter((feedback) => feedback.comfortTags?.includes("sleepy") || feedback.comfort === "sleepy").length
  const bloatedSignals = feedbacks.filter((feedback) => feedback.comfortTags?.includes("bloated") || feedback.comfort === "bloated").length

  if (stage === "body_puzzle") {
    return [
      `来自 ${sampleSize} 条饭后反馈`,
      `其中 ${comfortSignals} 次更舒服`,
      sleepySignals > 0 || bloatedSignals > 0 ? `困倦/胀气线索 ${sleepySignals + bloatedSignals} 次` : "当前未见明显重油困倦线索"
    ]
  }

  if (stage === "feedback") {
    return [
      `来自 ${sampleSize} 条饭后反馈`,
      `近 ${Math.min(sampleSize, 3)} 餐的即时感受`,
      `结合 ${meals.length} 餐结构记录`
    ]
  }

  return [
    meals.length > 0 ? `来自 ${meals.length} 餐结构记录` : "来自模拟规则",
    sampleSize > 0 ? `参考 ${sampleSize} 条饭后反馈` : "尚无饭后反馈样本",
    "先按最稳的蛋白和蔬菜组合做决策"
  ]
}

export function getRecommendationStageSummary(stage: RecommendationStage, feedbackCount: number) {
  return {
    stage,
    label: getRecommendationStageLabel(stage),
    unlockRequirement: getRecommendationStageUnlockRequirement(stage),
    confidenceLevel: getRecommendationStageConfidence(stage, feedbackCount)
  }
}
