import { create } from "zustand"
import { buildMockAnalysis, buildSeedAnalyses, createAnalysisCorrection, type MockAnalysisMode } from "../services/mockAnalysisService"
import { buildMockBodyPuzzleReport } from "../services/mockBodyPuzzleService"
import { updateDrawCardDecision } from "../services/mockDrawCardService"
import { attachAnalysisToMeal, attachFeedbackToMeal, createMockFeedback, createMockMeal, startMeal } from "../services/mockMealService"
import { createMockMealSeed, createSeedFeedbacks, mockProfile, mockUserId, nowIso } from "../services/mockSeedData"
import { scheduleFeedbackReminder } from "../services/notificationService"
import {
  authService,
  getAiMealAnalysisService,
  getAnalysisRepository,
  getDailyCheckinRepository,
  getDrawCardRepository,
  getFeedbackRepository,
  getMealRepository,
  getProfileRepository,
  getReportRepository,
  getStorageService,
  getWeightRepository
} from "../services"
import { getServiceMode } from "../services/serviceMode"
import type { Analysis, ComfortTag, DailyCheckin, Feedback, Fullness, MealRecord, MealType, PriceSatisfaction, Profile, Report, TasteFeedback, WeightLog } from "../types/meal"

type SeedScenario = 0 | 3 | 7

type BodyPuzzleState = {
  authUserId?: string
  authLoading: boolean
  authError?: string
  guestMode: boolean
  profile?: Profile
  meals: MealRecord[]
  analyses: Analysis[]
  feedbacks: Feedback[]
  dailyCheckins: DailyCheckin[]
  weightLogs: WeightLog[]
  report?: Report
  activeMealId?: string
  hydratePersistedData: () => Promise<void>
  sendPhoneOtp: (phone: string) => Promise<void>
  verifyPhoneOtp: (phone: string, token: string) => Promise<string>
  signOut: () => Promise<void>
  enterGuestMode: () => void
  setActiveMeal: (mealId: string) => void
  completeMockProfile: (input?: { goal?: string; avoid?: string; budget?: string; feeling?: string }) => Promise<void>
  createMockMeal: (mealType?: MealType, source?: MealRecord["source"], photoUri?: string) => string
  analyzeActiveMeal: (mode?: MockAnalysisMode) => void
  startActiveMeal: () => void
  addAnalysisCorrection: (input: { field: string; aiValue: string; userValue: string }) => void
  saveFeedback: (input: { fullness: Fullness; comfortTags: ComfortTag[]; tasteFeedback: TasteFeedback[]; priceSatisfaction?: PriceSatisfaction }) => void
  saveDailyCheckin: (input: { energy: NonNullable<DailyCheckin["energy"]>; digestion: NonNullable<DailyCheckin["digestion"]>; satiety: NonNullable<DailyCheckin["satiety"]> }) => void
  saveWeightLog: (valueKg: number) => void
  generateReport: () => void
  markCardDecision: (cardId: string, accepted: boolean) => void
  loadSeedScenario: (scenario: SeedScenario) => void
  resetMockData: () => void
}

export const useBodyPuzzleStore = create<BodyPuzzleState>((set, get) => ({
  authLoading: false,
  guestMode: false,
  meals: [],
  analyses: [],
  feedbacks: [],
  dailyCheckins: [],
  weightLogs: [],
  hydratePersistedData: async () => {
    if (!shouldPersistProductData()) return
    if (get().guestMode) return
    set({ authLoading: true, authError: undefined })
    try {
      const previousActiveMealId = get().activeMealId
      const authUserId = await authService.getSessionUserId()
      if (!authUserId) {
        set({ ...emptySignedOutState(), authLoading: false })
        return
      }
      set({ ...emptySignedOutState(), authUserId, authLoading: true, authError: undefined })
      const profile = await getProfileRepository().getCurrentProfile()
      const meals = await getMealRepository().listMeals(authUserId)
      const dailyCheckins = await getDailyCheckinRepository().listDailyCheckins(authUserId)
      const weightLogs = await getWeightRepository().listWeightLogs(authUserId)
      const activeMealId = meals.some((meal) => meal.id === previousActiveMealId) ? previousActiveMealId : meals[0]?.id
      set({
        authUserId,
        profile,
        meals,
        analyses: meals.flatMap((meal) => (meal.analysis ? [meal.analysis] : [])),
        feedbacks: meals.flatMap((meal) => (meal.feedback ? [meal.feedback] : [])),
        dailyCheckins,
        weightLogs,
        activeMealId,
        authLoading: false
      })
    } catch (error) {
      set({ authLoading: false, authError: getErrorMessage(error) })
    }
  },
  sendPhoneOtp: async (phone) => {
    set({ authLoading: true, authError: undefined })
    try {
      await authService.sendPhoneOtp(phone)
      set({ authLoading: false })
    } catch (error) {
      set({ authLoading: false, authError: getErrorMessage(error) })
      throw error
    }
  },
  verifyPhoneOtp: async (phone, token) => {
    set({ authLoading: true, authError: undefined })
    try {
      const authUserId = await authService.verifyPhoneOtp(phone, token)
      set({ authUserId, authLoading: true, authError: undefined })
      await get().hydratePersistedData()
      return authUserId
    } catch (error) {
      set({ authLoading: false, authError: getErrorMessage(error) })
      throw error
    }
  },
  signOut: async () => {
    set({ authLoading: true, authError: undefined })
    try {
      await authService.signOut()
      set({ ...emptySignedOutState(), authLoading: false })
    } catch (error) {
      set({ authLoading: false, authError: getErrorMessage(error) })
      throw error
    }
  },
  enterGuestMode: () => {
    set({
      ...emptySignedOutState(),
      guestMode: true,
      authUserId: mockUserId,
      profile: {
        ...mockProfile,
        id: mockUserId,
        updatedAt: nowIso()
      },
      authLoading: false,
      authError: undefined
    })
  },
  setActiveMeal: (mealId) => {
    set({ activeMealId: mealId })
  },
  completeMockProfile: async (input) => {
    const updatedAt = nowIso()
    const sessionUserId = shouldPersistProductData() ? await authService.getSessionUserId() : mockUserId
    const userId = sessionUserId ?? mockUserId
    const profile = {
        ...mockProfile,
        id: userId,
        goal: mapGoal(input?.goal),
        budgetLevel: mapBudget(input?.budget),
        avoidances: mapAvoidances(input?.avoid),
        avoidFoods: mapAvoidances(input?.avoid),
        commonFeelings: mapFeelings(input?.feeling),
        updatedAt
      }
    set({ profile, authUserId: userId })
    if (shouldPersistProductData()) {
      const saved = await getProfileRepository().saveProfile(profile)
      set({ profile: saved, authUserId: saved.id })
    }
  },
  createMockMeal: (mealType = "lunch", source = "photo", photoUri?: string) => {
    const userId = get().authUserId ?? mockUserId
    const meal = createMockMeal({
      userId,
      mealType,
      source,
      photoUri,
      mealCategory: source === "backfill" ? "补记餐次" : mealType === "breakfast" ? "早餐组合" : "外卖午餐"
    })
    set((state) => ({ meals: [meal, ...state.meals], activeMealId: meal.id }))
    if (shouldPersistProductData()) {
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
        meals: state.meals.map((item) => (item.id === meal.id ? attachAnalysisToMeal({ ...item, analysis }, analysis.id, analysis) : item))
      }))
      if (shouldPersistProductData()) {
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
    void scheduleFeedbackReminder(activeMealId, 60)
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
    if (shouldPersistProductData()) {
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
    if (shouldPersistProductData()) {
      void persistFeedback(activeMealId, feedback)
    }
  },
  saveDailyCheckin: (input) => {
    const state = get()
    const profile = state.profile ?? mockProfile
    const date = localDateKey(new Date())
    const mealIds = state.meals.filter((meal) => localDateKey(new Date(meal.createdAt)) === date).map((meal) => meal.id)
    const optimistic: DailyCheckin = {
      id: makeCheckinId(date),
      userId: profile.id,
      date,
      mealIds,
      dueAt: nowIso(),
      isNextDay: false,
      energy: input.energy,
      digestion: input.digestion,
      satiety: input.satiety,
      answeredAt: nowIso(),
      dismissed: false,
      createdAt: nowIso(),
      updatedAt: nowIso()
    }
    set((current) => ({ dailyCheckins: [optimistic, ...current.dailyCheckins.filter((item) => item.date !== date)] }))
    if (shouldPersistProductData()) {
      void getDailyCheckinRepository().saveDailyCheckin(optimistic)
    }
  },
  saveWeightLog: (valueKg) => {
    const profile = get().profile ?? mockProfile
    const optimistic: WeightLog = { id: `weight-${Date.now()}`, userId: profile.id, valueKg, recordedAt: nowIso() }
    set((state) => ({
      weightLogs: [optimistic, ...state.weightLogs],
      profile: state.profile ? { ...state.profile, weightKg: valueKg, weight: valueKg, updatedAt: optimistic.recordedAt } : state.profile
    }))
    if (shouldPersistProductData()) {
      void getWeightRepository().saveWeightLog({ userId: profile.id, valueKg, recordedAt: optimistic.recordedAt })
    }
  },
  generateReport: () => {
    const { meals, feedbacks } = get()
    const report = buildMockBodyPuzzleReport(meals, feedbacks)
    set({ report })
    if (shouldPersistProductData()) {
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
    if (shouldPersistProductData()) {
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
      dailyCheckins: [],
      weightLogs: [],
      report: scenario === 0 ? undefined : buildMockBodyPuzzleReport(meals, feedbacks),
      activeMealId: meals[0]?.id
    })
  },
  resetMockData: () => {
    set(emptySignedOutState())
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

function shouldPersistProductData() {
  return getServiceMode() !== "mock" && !useBodyPuzzleStore.getState().guestMode
}

function localDateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function makeCheckinId(date: string) {
  return `checkin-${date}`
}

function emptySignedOutState() {
  return {
    authUserId: undefined,
    guestMode: false,
    profile: undefined,
    meals: [],
    analyses: [],
    feedbacks: [],
    dailyCheckins: [],
    weightLogs: [],
    report: undefined,
    activeMealId: undefined
  }
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message
  return "操作失败，请稍后再试"
}

async function persistCreatedMeal(localMeal: MealRecord) {
  const userId = await authService.getUserId()
  const photoUpload = await uploadMealPhotoIfNeeded(userId, localMeal)
  const persistedMeal = await getMealRepository().createMeal({
    userId,
    id: localMeal.id,
    mealType: localMeal.mealType,
    source: localMeal.source,
    photoUri: photoUpload?.url ?? localMeal.photoUri,
    photoPath: photoUpload?.path,
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
  const imageUrl = await resolveAnalysisImageUrl(userId, meal)
  const analysis = await getAiMealAnalysisService().analyzeMeal({
    userId,
    mealId: meal.id,
    imageUrl,
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
  const enrichedMeal: MealRecord = {
    ...meal,
    status: "analyzed",
    mealCategory: saved.dishName,
    cuisine: saved.cuisine,
    province: saved.province,
    updatedAt: nowIso()
  }
  await getMealRepository().updateMeal(enrichedMeal)
  useBodyPuzzleStore.setState((current) => ({
    analyses: [saved, ...current.analyses.filter((item) => item.mealId !== meal.id)],
    meals: current.meals.map((item) => (item.id === meal.id ? attachAnalysisToMeal({ ...item, ...enrichedMeal, analysis: saved }, saved.id, saved) : item))
  }))
}

async function resolveAnalysisImageUrl(userId: string, meal: MealRecord) {
  const photoUri = meal.photoUri
  if (!photoUri) return "mock://meal-photo"
  if (isRemoteOrMockUri(photoUri)) return photoUri

  const storage = getStorageService()
  if (isStoragePath(photoUri)) {
    return (await storage.createSignedMealPhotoUrl(photoUri)) ?? photoUri
  }

  const upload = await uploadMealPhotoIfNeeded(userId, meal)
  return upload?.url ?? photoUri
}

async function uploadMealPhotoIfNeeded(userId: string, meal: MealRecord) {
  if (!meal.photoUri || isRemoteOrMockUri(meal.photoUri) || isStoragePath(meal.photoUri)) return undefined
  return getStorageService().uploadMealPhoto({
    userId,
    mealId: meal.id,
    uri: meal.photoUri,
    kind: "before"
  })
}

function isRemoteOrMockUri(uri: string) {
  return uri.startsWith("http://") || uri.startsWith("https://") || uri.startsWith("mock://")
}

function isStoragePath(uri: string) {
  return /^[^:/]+\/meals\/[^/]+\/(before|after)\.jpg$/.test(uri)
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
