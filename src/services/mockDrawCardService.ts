import type { DrawCard, Feedback, MealRecord } from "../types/meal"

export function buildMockDrawCards(meals: MealRecord[], feedbacks: Feedback[]): DrawCard[] {
  const hasSleepyFeedback = feedbacks.some((feedback) => feedback.comfortTags?.includes("sleepy") || feedback.comfort === "sleepy")
  const sampleSize = feedbacks.length

  return [
    {
      id: "safe-card-001",
      type: "safe",
      title: "午饭安全牌",
      reason: "你反馈更舒服的餐次通常是蛋白质足、蔬菜更多、主食适中的组合。",
      source: sampleSize > 0 ? `来自 ${sampleSize} 条饭后反馈` : "来自模拟规则",
      action: "牛肉饭加青菜，米饭先吃 2/3。",
      description: "牛肉饭 + 青菜，米饭吃 2/3。"
    },
    {
      id: "risk-card-001",
      type: "risk",
      title: "午后风险牌",
      reason: hasSleepyFeedback ? "重油主食组合和困倦反馈一起出现过。" : "样本还少，先把重油主食组合作为观察对象。",
      risk: "可能更容易困或吃撑，但需要继续用反馈验证。",
      source: meals.length > 0 ? `来自 ${meals.length} 餐结构记录` : "来自模拟规则",
      action: "如果选炸鸡饭，饮料换无糖茶，主食少吃几口。",
      description: "炸鸡饭 + 奶茶可能让你下午更困，建议换无糖茶。"
    }
  ]
}

export function updateDrawCardDecision(cards: DrawCard[], cardId: string, accepted: boolean, decidedAt: string): DrawCard[] {
  return cards.map((card) => (card.id === cardId ? { ...card, accepted, decidedAt } : card))
}
