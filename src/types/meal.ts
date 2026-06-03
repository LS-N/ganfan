// ── 饭前抽卡槽位系统（蓝图三槽位：stable / alt / explore）─────────────────
export type CardSlot = "stable" | "alt" | "explore"
export type CardSlotLabel = "常规款" | "特别款" | "隐藏款"

// ── 营养结构（每餐实际摄入量，用于 Phase 2 DishScore 和营养目标追踪）──────
export interface Nutrition {
  calories: number  // kcal
  protein: number   // g
  carbs: number     // g
  fat: number       // g
}

// ── 来源推荐卡信息（meals.from_card 的结构化类型）─────────────────────────
export interface FromCard {
  dish: string
  badge: string
  risk: string | null
  slot: CardSlot
  slotLabel: CardSlotLabel
  cardState: string | null
  recommendationStage: string
  recommendationStageLabel?: string
  recommendationReason?: string
  recommendationSources?: string
  unlockRequirement?: string
  confidenceLevel?: string
}

// ── MealType 中文显示标签（DB 存英文 key，显示/Prompt 用中文）──────────────
export const MEAL_TYPE_LABELS: Record<string, string> = {
  breakfast: "早饭",
  lunch: "午饭",
  dinner: "晚饭",
  snack: "加餐"
}

export type AgeRange = "under_25" | "25_34" | "35_44" | "45_plus"

export type Gender = "female" | "male" | "other" | "unknown"

export type Goal = "feel_better" | "fat_loss" | "stable_energy" | "eat_regularly"

export type BudgetLevel = "low" | "medium" | "high"

export type MealBudget = {
  breakfast: number
  lunch: number
  dinner: number
}

export type CommonFeeling = "sleepy" | "bloated" | "hungry_fast" | "energetic"

export type Profile = {
  id: string
  ageRange?: AgeRange
  gender?: Gender
  heightCm?: number
  weightKg?: number
  goal: Goal
  /** 单日饮食预算（元），替代原 budgetLevel / mealBudgets；权重分配由后台 meal_budget_weights 表管理 */
  dailyBudget?: number
  /** 后台静默标注，不在档案页展示，用于 AI 个性化建议风格 */
  eatingStyle?: string
  avoidances: string[]
  tastePreferences: string[]
  commonFeelings: string[]
  createdAt: string
  updatedAt: string

  /**
   * Temporary compatibility fields for current shell screens.
   * Phase 1 UI sprints should gradually read the canonical fields above.
   */
  age: number
  height: number
  weight: number
  goalType: "fat_loss" | "maintain" | "post_meal_energy"
  /** @deprecated 使用 dailyBudget 替代，Phase 2 前移除 */
  mealBudgets: MealBudget
  /** @deprecated 使用 budgetLevel 已废弃，由 dailyBudget 整数替代 */
  budgetLevel?: BudgetLevel
  avoidFoods: string[]
}

export type WeightLog = {
  id: string
  userId: string
  valueKg: number
  recordedAt: string
}

export type MealType = "breakfast" | "lunch" | "dinner" | "snack"

export type MealStatus =
  | "draft"
  | "analyzing"
  | "analysis_failed"
  | "ready_to_eat"
  | "eating"
  | "pending_feedback"
  | "completed"
  | "missed_feedback"
  | "photo_ready"
  | "analyzed"
  | "feedback_completed"

export type MealSource = "photo" | "album" | "backfill" | "draw_card"

export type Level = "low" | "medium" | "high" | "unknown"

export type OilLevel = "light" | "medium" | "heavy" | "unknown"

export type AnalysisConfidence = "high" | "medium" | "low"

export type RecommendationStage =
  | "general"
  | "feedback"
  | "body_puzzle"
  | "body_structure"
  | "fulfillment"
  | "food_memory"

export type EatingAdviceItem = {
  tip: string
  type: "positive" | "caution"
}

export type RecognizedFood = {
  name: string
  weight: string
  confidence?: AnalysisConfidence
  nutritionSource?: "nutrition_db" | "ai_estimate" | "pending"
  matchedNutritionName?: string
  matchConfidence?: number
}

export type MealAnalysis = {
  id: string
  mealId: string
  dishName: string
  cuisine?: string
  province?: string
  structureSummary: string
  stapleLevel: Level
  proteinLevel: Level
  vegetableFiberLevel: Level
  oilLevel: OilLevel
  portionLevel: Level
  riskHints: string[]
  eatingAdvice: string[]
  feedbackFocus: string[]
  confidence: AnalysisConfidence
  source: "mock" | "ai"
  raw?: unknown
  createdAt: string

  // Phase 2+ 基础字段：DishScore、营养目标追踪所需
  nutrition?: Nutrition
  tags?: string[]            // 审批列表标签：高蛋白/高碳水/高脂肪/轻食/清淡/重口…
  adviceStage?: RecommendationStage  // 建议来源阶段，Phase 2 起可升级
  recognizedFoods?: RecognizedFood[] // 含 confidence，用于低置信度俯拍提示
  eatingAdviceItems?: EatingAdviceItem[] // 结构化建议，与 eatingAdvice string[] 并存

  /**
   * Temporary compatibility fields for current shell screens.
   */
  oilBurdenLevel: Exclude<Level, "unknown">
  lightSuggestions: string[]
  imageQualityNote?: string
}

export type Analysis = MealAnalysis

export type Fullness = "hungry" | "just_right" | "full" | "overfull" | "too_full"

export type ComfortTag = "comfortable" | "bloated" | "sleepy" | "energetic"

export type MealComfort = ComfortTag | "uncomfortable"

export type SleepinessLevel = "none" | "mild" | "obvious"

export type BloatingLevel = "none" | "mild" | "obvious"

/** @deprecated Phase 1.1 移除：反馈不再采集价格满意度，satisfaction_avg 只反映身体感受 */
export type PriceSatisfaction = "good" | "ok" | "bad" | "worth_it" | "normal" | "expensive"

export type TasteFeedback = "tasty" | "normal" | "too_salty" | "too_oily" | "too_spicy" | "too_plain"

export type FeedbackTimingStatus = "on_time" | "early" | "late"

export type MealFeedback = {
  id: string
  mealId: string
  fullness: Fullness
  comfort: MealComfort
  sleepiness?: SleepinessLevel
  bloating?: BloatingLevel
  energy?: "low" | "stable" | "better"
  priceSatisfaction?: PriceSatisfaction
  note?: string
  submittedAt: string

  /**
   * Temporary compatibility fields for current shell screens.
   */
  comfortTags: ComfortTag[]
  tasteFeedback: TasteFeedback[]
  timingStatus?: FeedbackTimingStatus
  createdAt: string
}

export type Feedback = MealFeedback

export type MealImage = {
  id: string
  mealId: string
  imageType: "wide" | "close" | "leftover"
  localUri?: string
  storageUrl?: string
  createdAt: string
}

export type AnalysisCorrection = {
  id: string
  field: string
  aiValue: string
  userValue: string
  correctedAt: string
}

export type Meal = {
  id: string
  userId?: string
  mealType: MealType
  status: MealStatus
  photoUri?: string
  source: MealSource
  cuisine?: string
  province?: string
  createdAt: string
  photoTakenAt?: string
  mealStartedAt?: string
  feedbackDueAt?: string
  completedAt?: string
  updatedAt: string
  analysis?: MealAnalysis
  corrections: AnalysisCorrection[]
  feedback?: MealFeedback
  // Phase 2+ 推荐闭环：card_actions → meals.fromCard → meal_feedback → DishScore
  fromCard?: FromCard | null
  /** @deprecated 使用 fromCard 替代 */
  drawCardId?: string

  /**
   * Temporary compatibility fields for current shell screens.
   */
  mealTime?: string
  locationLabel?: string
  imageId?: string
  mealCategory?: string
  analysisId?: string
  feedbackId?: string
}

export type MealRecord = Meal

export type BodyPuzzleReportStatus = "no_data" | "warming_up" | "first_signal" | "weekly_report"

export type BodyPuzzlePattern = {
  id: string
  title: string
  evidence: string
  confidence: "early" | "medium" | "strong"
}

export type DrawCard = {
  id: string
  // 槽位系统（蓝图三槽位，Phase 2 body_puzzle DishScore 加权必需）
  slot?: CardSlot          // 'stable' | 'alt' | 'explore'
  slotLabel?: CardSlotLabel // '常规款' | '特别款' | '隐藏款'
  badge?: string           // '● STANDARD' | '◆ LIMITED' | '★ RARE'
  dish?: string            // 推荐菜名（canonical，card_actions 写入用）
  advice?: string          // 吃法建议（Claude 生成，与 reason 分开）
  // 卡片风险类型（当前 mock：'safe'|'risk'；蓝图最终：'repeat'|'safe'|'explore'）
  type: "safe" | "risk" | "repeat" | "explore"
  title: string
  reason: string
  risk?: string
  source: string
  action: string
  accepted?: boolean
  decidedAt?: string
  recommendationStage?: RecommendationStage
  recommendationStageLabel?: string
  recommendationReason?: string
  recommendationSources?: string[]
  unlockRequirement?: string
  confidenceLevel?: AnalysisConfidence

  /**
   * Temporary compatibility fields for current shell screens.
   */
  description?: string
}

export type DrawCardRule = DrawCard

export type BodyPuzzleReport = {
  id: string
  userId: string
  status: BodyPuzzleReportStatus
  startDate: string
  endDate: string
  sampleSize: number
  patterns: BodyPuzzlePattern[]
  safeFoods: string[]
  riskCombos: string[]
  nextWeekSuggestion: string[]
  drawCards: DrawCard[]
  generatedAt: string

  /**
   * Temporary compatibility fields for current shell screens.
   */
  effectiveMealCount: number
  riskCombinations: string[]
  nextWeekSuggestions: string[]
  drawCardRules: DrawCardRule[]
  createdAt: string
}

export type Report = BodyPuzzleReport

export type TodayPageStatus = "empty" | "before_meal" | "analyzing" | "ready_to_eat" | "eating" | "pending_feedback" | "done"

export type RecordPageStatus = "idle" | "photo_selected" | "analyzing" | "analysis_failed"

export type AnalysisPageStatus = "loading" | "success" | "low_confidence" | "failed" | "editable"

export type FeedbackPageStatus = "not_due" | "available" | "submitted" | "missed"
