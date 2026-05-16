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
  budgetLevel?: BudgetLevel
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
  mealBudgets: MealBudget
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

export type DailyCheckin = {
  id: string
  userId: string
  date: string
  mealIds: string[]
  dueAt: string
  isNextDay: boolean
  energy?: "low" | "stable" | "better"
  digestion?: "comfortable" | "bloated" | "upset"
  satiety?: "hungry_fast" | "just_right" | "too_full"
  answeredAt?: string
  dismissed: boolean
  createdAt: string
  updatedAt: string
}

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
  type: "safe" | "risk"
  title: string
  reason: string
  risk?: string
  source: string
  action: string
  accepted?: boolean
  decidedAt?: string

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
