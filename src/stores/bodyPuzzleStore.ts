import { create } from "zustand"
import { buildMockAnalysis, buildSeedAnalyses, createAnalysisCorrection, type MockAnalysisMode } from "../services/mockAnalysisService"
import { buildMockBodyPuzzleReport } from "../services/mockBodyPuzzleService"
import { updateDrawCardDecision } from "../services/mockDrawCardService"
import { attachAnalysisToMeal, attachFeedbackToMeal, createMockFeedback, createMockMeal, startMeal } from "../services/mockMealService"
import { createMockMealSeed, createSeedFeedbacks, mockProfile, mockUserId, nowIso } from "../services/mockSeedData"
import { authService, getAiMealAnalysisService, getAnalysisRepository, getDrawCardRepository, getFeedbackRepository, getMealRepository, getReportRepository } from "../services"
import { shouldUseRealServices } from "../services/serviceMode"
import type { Analysis, ComfortTag, Feedback, Fullness, MealRecord, MealType, PriceSatisfaction, Profile, Report, TasteFeedback } from "../types/meal"

type SeedScenario = 0 | 3 | 7

type BodyPuzzleState = {
  profile?: Profile
  meals: MealRecord[]
  analyses: Analysis[]
  feedbacks: Feedback[]
  report?: Report
  activeMealId?: string
  hydratePersistedData: () => Promise<void>
  setActiveMeal: (mealId: string) => void
  completeMockProfile: (input?: { goal?: string; avoid?: string; budget?: string; feeling?: string }) => void
  createMockMeal: (mealType?: MealType, source?: MealRecord["source"]) => string
  analyzeActiveMeal: (mode?: MockAnalysisMode) => void
  startActiveMeal: () => void
  addAnalysisCorrection: (input: { field: string; aiValue: string; userValue: string }) => void
  saveFeedback: (input: { fullness: Fullness; comfortTags: ComfortTag[]; tasteFeedback: TasteFeedback[]; priceSatisfaction?: PriceSatisfaction }) => void
  generateReport: () => void
  markCardDecision: (cardId: string, accepted: boolean) => void
  loadSeedScenario: (scenario: SeedScenario) => void
  resetMockData: () => void
}

export const useBodyPuzzleStore = create<BodyPuzzleState>((set, get) => ({
  meals: [],
  analyses: [],
  feedbacks: [],
  hydratePersistedData: async () => {
    const meals = await getMealRepository().listMeals()
    if (!meals.length) return
    set({
      meals,
      analyses: meals.flatMap((meal) => (meal.analysis ? [meal.analysis] : [])),
      feedbacks: meals.flatMap((meal) => (meal.feedback ? [meal.feedback] : [])),
      activeMealId: get().activeMealId ?? meals[0]?.id
    })
  },
  setActiveMeal: (mealId) => {
    set({ activeMealId: mealId })
  },
  completeMockProfile: (input) => {
    const updatedAt = nowIso()
    set({
      profile: {
        ...mockProfile,
        goal: mapGoal(input?.goal),
        budgetLevel: mapBudget(input?.budget),
        avoidances: mapAvoidances(input?.avoid),
        avoidFoods: mapAvoidances(input?.avoid),
        commonFeelings: mapFeelings(input?.feeling),
        updatedAt
      }
    })
  },
  createMockMeal: (mealType = "lunch", source = "photo") => {
    const meal = createMockMeal({
      userId: mockUserId,
      mealType,
      source,
      mealCategory: source === "backfill" ? "补记餐次" : mealType === "breakfast" ? "早餐组合" : "外卖午餐"
    })
    set((state) => ({ meals: [meal, ...state.meals], activeMealId: meal.id }))
    if (shouldUseRealServices()) {
      void persistCreatedMeal(meal)
    }
    return meal.id
  },
  analyzeActiveMeal: (mode = "success") => {
    const { activeMealId, meals } = get()
    const meal = meals.find((item) => item.id === activeMealId)
    if (!meal) return

    try {
      const analysis = buildMockAnalysis(meal, mode)
      set((state) => ({
        analyses: [analysis, ...state.analyses.filter((item) => item.mealId !== meal.id)],
        meals: state.meals.map((item) => (item.id === meal.id ? attachAnalysisToMeal({ ...item, analysis }, analysis.id) : item))
      }))
      if (shouldUseRealServices()) {
        void persistAnalysis(meal)
      }
    } catch {
      set((state) => ({
        analyses: state.analyses.filter((item) => item.mealId !== meal.id),
        meals: state.meals.map((item) => (item.id === meal.id ? { ...item, status: "analysis_failed", updatedAt: nowIso() } : item))
      }))
    }
  },
  startActiveMeal: () => {
    const { activeMealId } = get()
    if (!activeMealId) return

    set((state) => ({
      meals: state.meals.map((meal) => (meal.id === activeMealId ? startMeal(meal) : meal))
    }))
  },
  addAnalysisCorrection: (input) => {
    const { activeMealId } = get()
    if (!activeMealId) return

    const correction = createAnalysisCorrection(input)
    set((state) => ({
      meals: state.meals.map((meal) =>
        meal.id === activeMealId ? { ...meal, corrections: [...meal.corrections, correction], updatedAt: correction.correctedAt } : meal
      )
    }))
    if (shouldUseRealServices()) {
      const analysisId = get().analyses.find((analysis) => analysis.mealId === activeMealId)?.id
      void getAnalysisRepository().saveCorrection({ ...correction, mealId: activeMealId, analysisId })
    }
  },
  saveFeedback: (input) => {
    const { activeMealId } = get()
    if (!activeMealId) return

    const feedback = createMockFeedback(activeMealId, input)
    set((state) => ({
      feedbacks: [feedback, ...state.feedbacks.filter((item) => item.mealId !== activeMealId)],
      meals: state.meals.map((meal) => (meal.id === activeMealId ? attachFeedbackToMeal({ ...meal, feedback }, feedback.id) : meal))
    }))
    if (shouldUseRealServices()) {
      void persistFeedback(activeMealId, feedback)
    }
  },
  generateReport: () => {
    const { meals, feedbacks } = get()
    const report = buildMockBodyPuzzleReport(meals, feedbacks)
    set({ report })
    if (shouldUseRealServices()) {
      void persistReport(report)
    }
  },
  markCardDecision: (cardId, accepted) => {
    set((state) => {
      if (!state.report) return state
      const decidedAt = nowIso()
      const drawCards = updateDrawCardDecision(state.report.drawCards, cardId, accepted, decidedAt)
      return {
        report: {
          ...state.report,
          drawCards,
          drawCardRules: drawCards
        }
      }
    })
    if (shouldUseRealServices()) {
      void getDrawCardRepository().updateDecision(cardId, accepted)
    }
  },
  loadSeedScenario: (scenario) => {
    const meals = createMockMealSeed(scenario)
    const analyses = buildSeedAnalyses(meals)
    const feedbacks = createSeedFeedbacks(meals)
    set({
      profile: { ...mockProfile },
      meals,
      analyses,
      feedbacks,
      report: scenario === 0 ? undefined : buildMockBodyPuzzleReport(meals, feedbacks),
      activeMealId: meals[0]?.id
    })
  },
  resetMockData: () => {
    set({
      profile: undefined,
      meals: [],
      analyses: [],
      feedbacks: [],
      report: undefined,
      activeMealId: undefined
    })
  }
}))

export function getLevelLabel(level: Analysis["stapleLevel"] | Analysis["oilLevel"]) {
  const labels = {
    low: "偏少",
    light: "偏轻",
    medium: "适中",
    high: "偏高",
    heavy: "偏高",
    unknown: "待确认"
  }
  return labels[level]
}

export function getMealTypeLabel(mealType: MealType) {
  const labels = {
    breakfast: "早餐",
    lunch: "午餐",
    dinner: "晚餐",
    snack: "加餐"
  }
  return labels[mealType]
}

function mapGoal(value?: string): Profile["goal"] {
  if (value === "轻松减脂") return "fat_loss"
  if (value === "吃得更满足") return "feel_better"
  if (value === "消化更好") return "eat_regularly"
  return "stable_energy"
}

function mapBudget(value?: string): Profile["budgetLevel"] {
  if (value?.includes("10")) return "low"
  if (value?.includes("50")) return "high"
  return "medium"
}

function mapAvoidances(value?: string) {
  if (!value || value === "无限制") return []
  if (value === "不吃辣") return ["太辣"]
  if (value === "不吃海鲜") return ["海鲜"]
  if (value === "少油少盐") return ["太油", "太咸"]
  return [value]
}

function mapFeelings(value?: string) {
  if (value === "胀气不舒服") return ["bloated"]
  if (value === "基本还好") return ["energetic"]
  if (value === "吃撑后悔") return ["hungry_fast"]
  return ["sleepy"]
}

async function persistCreatedMeal(localMeal: MealRecord) {
  const userId = await authService.getUserId()
  const persistedMeal = await getMealRepository().createMeal({
    userId,
    mealType: localMeal.mealType,
    source: localMeal.source,
    photoUri: localMeal.photoUri,
    mealCategory: localMeal.mealCategory,
    drawCardId: localMeal.drawCardId
  })

  useBodyPuzzleStore.setState((state) => ({
    activeMealId: state.activeMealId === localMeal.id ? persistedMeal.id : state.activeMealId,
    meals: state.meals.map((meal) => (meal.id === localMeal.id ? { ...persistedMeal, analysis: meal.analysis, corrections: meal.corrections, feedback: meal.feedback } : meal))
  }))
}

async function persistAnalysis(meal: MealRecord) {
  const state = useBodyPuzzleStore.getState()
  const profile = state.profile ?? mockProfile
  const userId = await authService.getUserId()
  const analysis = await getAiMealAnalysisService().analyzeMeal({
    userId,
    mealId: meal.id,
    imageUrl: meal.photoUri ?? "mock://meal-photo",
    mealType: meal.mealType,
    profileContext: {
      goal: profile.goal,
      avoidances: profile.avoidances,
      tastePreferences: profile.tastePreferences,
      commonFeelings: profile.commonFeelings
    },
    recentSignals: state.meals.slice(0, 5).map((item) => ({
      dishName: item.analysis?.dishName,
      structureSummary: item.analysis?.structureSummary,
      fullness: item.feedback?.fullness,
      comfort: item.feedback?.comfort
    }))
  })
  const saved = await getAnalysisRepository().saveAnalysis(analysis)
  useBodyPuzzleStore.setState((current) => ({
    analyses: [saved, ...current.analyses.filter((item) => item.mealId !== meal.id)],
    meals: current.meals.map((item) => (item.id === meal.id ? attachAnalysisToMeal({ ...item, analysis: saved }, saved.id) : item))
  }))
}

async function persistFeedback(mealId: string, feedback: Feedback) {
  const saved = await getFeedbackRepository().saveFeedback({
    mealId,
    fullness: feedback.fullness,
    comfort: feedback.comfort,
    sleepiness: feedback.sleepiness,
    bloating: feedback.bloating,
    energy: feedback.energy,
    priceSatisfaction: feedback.priceSatisfaction,
    note: feedback.note,
    comfortTags: feedback.comfortTags,
    tasteFeedback: feedback.tasteFeedback
  })
  useBodyPuzzleStore.setState((state) => ({
    feedbacks: [saved, ...state.feedbacks.filter((item) => item.mealId !== mealId)],
    meals: state.meals.map((meal) => (meal.id === mealId ? attachFeedbackToMeal({ ...meal, feedback: saved }, saved.id) : meal))
  }))
}

async function persistReport(report: Report) {
  const savedReport = await getReportRepository().saveReport(report)
  const savedCards = await getDrawCardRepository().saveDrawCards(report.drawCards, savedReport.userId, savedReport.id)
  useBodyPuzzleStore.setState({
    report: {
      ...savedReport,
      drawCards: savedCards,
      drawCardRules: savedCards
    }
  })
}
