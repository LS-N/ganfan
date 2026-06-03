import type { DrawCard, Feedback, MealRecord } from "../types/meal"
import {
  deriveRecommendationStage,
  getPreviousRecommendationStage,
  getRecommendationStageConfidence,
  getRecommendationStageLabel,
  getRecommendationStageSources,
  getRecommendationStageSummary
} from "./recommendationStages"

type DrawCardSeed = Omit<DrawCard, "description">

export function buildMockDrawCards(meals: MealRecord[], feedbacks: Feedback[]): DrawCard[] {
  const activeStage = deriveRecommendationStage(feedbacks.length)
  const comparisonStage = getPreviousRecommendationStage(activeStage)
  const fallbackStage = activeStage === "general" ? "general" : activeStage

  return [
    buildSafeCard(meals, feedbacks, activeStage),
    buildComparisonCard(meals, feedbacks, comparisonStage, activeStage),
    buildRiskCard(meals, feedbacks, fallbackStage)
  ]
}

function buildSafeCard(meals: MealRecord[], feedbacks: Feedback[], stage: DrawCard["recommendationStage"]) {
  const stageKey = stage ?? "general"
  const summary = getRecommendationStageSummary(stageKey, feedbacks.length)
  const hasBodyPuzzle = stageKey === "body_puzzle"
  const hasFeedback = stageKey === "feedback"

  return decorateCard({
    id: "safe-card-001",
    slot: "stable",
    slotLabel: "常规款",
    badge: "● STANDARD",
    dish: "牛肉饭加青菜",
    type: "safe",
    title: "午饭安全牌",
    reason: hasBodyPuzzle
      ? "你最近 7 餐的反馈已经足够稳定，蛋白足、蔬菜多、主食适中的组合最稳。"
      : hasFeedback
        ? "最近几次反馈都指向更清爽、少油、主食适中的组合。"
        : "先按最稳的结构吃：蛋白和菜先上，主食收一点。",
    source: getRecommendationStageSources(stageKey, meals, feedbacks).join(" · "),
    action: "牛肉饭加青菜，米饭先吃 2/3。",
    advice: "米饭先吃 2/3，蛋白和菜先上，剩下的看饱腹感。",
    recommendationStage: summary.stage,
    recommendationStageLabel: summary.label,
    recommendationReason: hasBodyPuzzle
      ? "身体拼图里，蛋白足、蔬菜多、主食适中的组合最稳定。"
      : hasFeedback
        ? "反馈里更舒服的餐次，普遍都更清爽、少油、主食适中。"
        : "样本还少，先用最稳的结构做饭前决策。",
    recommendationSources: getRecommendationStageSources(stageKey, meals, feedbacks),
    unlockRequirement: summary.unlockRequirement,
    confidenceLevel: summary.confidenceLevel
  })
}

function buildComparisonCard(meals: MealRecord[], feedbacks: Feedback[], stage: DrawCard["recommendationStage"], activeStage: DrawCard["recommendationStage"]) {
  const stageKey = stage ?? "general"
  const summary = getRecommendationStageSummary(stageKey, feedbacks.length)
  const activeLabel = activeStage ? getRecommendationStageLabel(activeStage) : "通用推荐"
  const sourceLines = getRecommendationStageSources(stageKey, meals, feedbacks)

  return decorateCard({
    id: "safe-card-002",
    slot: "alt",
    slotLabel: "特别款",
    badge: "◆ LIMITED",
    dish: "清汤麻辣烫",
    type: "safe",
    title: "换口味也稳",
    reason:
      stageKey === "feedback"
        ? "如果今天想换一个方向，反馈里被验证过的清爽组合也还稳。"
        : stageKey === "body_puzzle"
          ? "身体拼图已经能看出第二条稳妥路径，换口味也不容易踩空。"
          : "样本还少时，先把这张当成稳妥备选。",
    source: sourceLines.join(" · "),
    action: "清汤麻辣烫，少油不加粉，先吃菜和蛋白。",
    advice: "少油不加粉，先把菜和蛋白吃完再加主食。",
    recommendationStage: summary.stage,
    recommendationStageLabel: summary.label,
    recommendationReason:
      stageKey === "feedback"
        ? "反馈建议已经成立，换口味时优先清爽少油。"
        : stageKey === "body_puzzle"
          ? "身体拼图里第二稳的组合，适合做备选。"
          : `当前主阶段还是 ${activeLabel}，这张卡先作为备用路线。`,
    recommendationSources: sourceLines,
    unlockRequirement: summary.unlockRequirement,
    confidenceLevel: getRecommendationStageConfidence(stageKey, feedbacks.length)
  })
}

function buildRiskCard(meals: MealRecord[], feedbacks: Feedback[], stage: DrawCard["recommendationStage"]) {
  const stageKey = stage ?? "general"
  const summary = getRecommendationStageSummary(stageKey, feedbacks.length)
  const hasSleepyFeedback = feedbacks.some((feedback) => feedback.comfortTags?.includes("sleepy") || feedback.comfort === "sleepy")
  const hasBloatingFeedback = feedbacks.some((feedback) => feedback.comfortTags?.includes("bloated") || feedback.comfort === "bloated")
  const sourceLines = getRecommendationStageSources(stageKey, meals, feedbacks)

  return decorateCard({
    id: "risk-card-001",
    slot: "explore",
    slotLabel: "隐藏款",
    badge: "★ RARE",
    dish: "炸鸡饭",
    type: "risk",
    title: "午后风险牌",
    reason: hasSleepyFeedback || hasBloatingFeedback ? "重油主食组合和困倦/胀气反馈一起出现过。" : "样本还少，先把重油主食组合作为观察对象。",
    risk: hasSleepyFeedback ? "可能更容易困" : hasBloatingFeedback ? "可能更容易吃撑" : "样本不足，仍需继续验证",
    source: sourceLines.join(" · "),
    action: "如果选炸鸡饭，饮料换无糖茶，主食少吃几口。",
    advice: "饮料换无糖茶，主食先吃 1/2，饭后记录一下是否困。",
    recommendationStage: summary.stage,
    recommendationStageLabel: summary.label,
    recommendationReason: hasSleepyFeedback || hasBloatingFeedback
      ? "这张卡用来提醒高风险组合，避免让困倦和胀气继续重复出现。"
      : "当前样本还少，先把最重油的组合当成风险观察对象。",
    recommendationSources: sourceLines,
    unlockRequirement: summary.unlockRequirement,
    confidenceLevel: summary.confidenceLevel
  })
}

function decorateCard(card: DrawCardSeed): DrawCard {
  return {
    ...card,
    description: card.action,
    reason: card.recommendationReason ?? card.reason,
    source: card.recommendationSources?.join(" · ") ?? card.source
  }
}

export function updateDrawCardDecision(cards: DrawCard[], cardId: string, accepted: boolean, decidedAt: string): DrawCard[] {
  return cards.map((card) => (card.id === cardId ? { ...card, accepted, decidedAt } : card))
}
