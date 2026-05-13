import { buildMockBodyPuzzleReport } from "./mockBodyPuzzleService"
import { buildMockDrawCards } from "./mockDrawCardService"
import { buildMockAnalysis, createAnalysisCorrection } from "./mockAnalysisService"
import { attachFeedbackToMeal, createMockFeedback, createMockMeal } from "./mockMealService"
import { makeMockId, mockProfile, mockUserId, nowIso } from "./mockSeedData"
import type { Analysis, AnalysisCorrection, BodyPuzzleReport, DrawCard, Feedback, MealRecord, MealStatus, Profile } from "../types/meal"
import type { AnalysisRepository, AuthService, CreateMealInput, DrawCardRepository, FeedbackRepository, MealRepository, ProfileRepository, ReportRepository, SaveFeedbackInput, StorageService } from "./repositoryTypes"

const mockState = {
  profile: undefined as Profile | undefined,
  meals: [] as MealRecord[],
  analyses: [] as Analysis[],
  feedbacks: [] as Feedback[],
  report: undefined as BodyPuzzleReport | undefined,
  drawCards: [] as DrawCard[]
}

export function resetMockRepositoryState() {
  mockState.profile = undefined
  mockState.meals = []
  mockState.analyses = []
  mockState.feedbacks = []
  mockState.report = undefined
  mockState.drawCards = []
}

export function getMockRepositoryState() {
  return mockState
}

export const mockAuthService: AuthService = {
  async getUserId() {
    return mockUserId
  },
  async signInAnonymously() {
    return mockUserId
  }
}

export const mockProfileRepository: ProfileRepository = {
  async getCurrentProfile() {
    return mockState.profile
  },
  async saveProfile(profile) {
    mockState.profile = { ...mockProfile, ...profile, updatedAt: nowIso() }
    return mockState.profile
  }
}

export const mockMealRepository: MealRepository = {
  async createMeal(input: CreateMealInput) {
    const meal = createMockMeal(input)
    mockState.meals = [meal, ...mockState.meals]
    return meal
  },
  async updateMealStatus(mealId: string, status: MealStatus) {
    mockState.meals = mockState.meals.map((meal) => (meal.id === mealId ? { ...meal, status, updatedAt: nowIso() } : meal))
  },
  async updateMeal(meal: MealRecord) {
    mockState.meals = mockState.meals.map((item) => (item.id === meal.id ? meal : item))
    return meal
  },
  async listMeals() {
    return mockState.meals
  },
  async getMeal(mealId: string) {
    return mockState.meals.find((meal) => meal.id === mealId)
  }
}

export const mockAnalysisRepository: AnalysisRepository = {
  async saveAnalysis(input: Analysis) {
    mockState.analyses = [input, ...mockState.analyses.filter((analysis) => analysis.mealId !== input.mealId)]
    mockState.meals = mockState.meals.map((meal) => (meal.id === input.mealId ? { ...meal, analysis: input, analysisId: input.id, status: "analyzed", updatedAt: nowIso() } : meal))
    return input
  },
  async saveCorrection(input: AnalysisCorrection & { mealId: string }) {
    const correction = input.id ? input : createAnalysisCorrection(input)
    mockState.meals = mockState.meals.map((meal) =>
      meal.id === input.mealId ? { ...meal, corrections: [...meal.corrections, correction], updatedAt: correction.correctedAt } : meal
    )
    return correction
  },
  async listAnalyses() {
    return mockState.analyses
  },
  async getAnalysisByMeal(mealId: string) {
    return mockState.analyses.find((analysis) => analysis.mealId === mealId)
  }
}

export const mockFeedbackRepository: FeedbackRepository = {
  async saveFeedback(input: SaveFeedbackInput) {
    const feedback = createMockFeedback(input.mealId, {
      fullness: input.fullness,
      comfortTags: input.comfortTags ?? [input.comfort === "uncomfortable" ? "comfortable" : input.comfort],
      tasteFeedback: input.tasteFeedback ?? ["normal"],
      priceSatisfaction: input.priceSatisfaction,
      note: input.note
    })
    mockState.feedbacks = [feedback, ...mockState.feedbacks.filter((item) => item.mealId !== input.mealId)]
    mockState.meals = mockState.meals.map((meal) => (meal.id === input.mealId ? attachFeedbackToMeal({ ...meal, feedback }, feedback.id) : meal))
    return feedback
  },
  async listFeedbacks() {
    return mockState.feedbacks
  }
}

export const mockReportRepository: ReportRepository = {
  async saveReport(report: BodyPuzzleReport) {
    mockState.report = report
    mockState.drawCards = report.drawCards
    return report
  },
  async getLatestReport() {
    if (!mockState.report) {
      mockState.report = buildMockBodyPuzzleReport(mockState.meals, mockState.feedbacks)
      mockState.drawCards = mockState.report.drawCards
    }
    return mockState.report
  }
}

export const mockDrawCardRepository: DrawCardRepository = {
  async saveDrawCards(cards: DrawCard[]) {
    mockState.drawCards = cards
    return cards
  },
  async updateDecision(cardId: string, accepted: boolean) {
    const decidedAt = nowIso()
    const existing = mockState.drawCards.find((card) => card.id === cardId)
    const updated = { ...(existing ?? buildMockDrawCards(mockState.meals, mockState.feedbacks)[0]), id: cardId, accepted, decidedAt }
    mockState.drawCards = [updated, ...mockState.drawCards.filter((card) => card.id !== cardId)]
    if (mockState.report) {
      mockState.report = {
        ...mockState.report,
        drawCards: mockState.report.drawCards.map((card) => (card.id === cardId ? updated : card)),
        drawCardRules: mockState.report.drawCardRules.map((card) => (card.id === cardId ? updated : card))
      }
    }
    return updated
  }
}

export const mockStorageService: StorageService = {
  async uploadMealPhoto(input) {
    return {
      path: `${input.userId}/meals/${input.mealId}/${input.kind}.jpg`,
      url: input.uri.startsWith("mock://") ? input.uri : `mock://${makeMockId("photo")}`
    }
  }
}

export async function createMockAnalysisForMeal(meal: MealRecord, mode: "success" | "low_confidence" | "failed" = "success") {
  return mockAnalysisRepository.saveAnalysis(buildMockAnalysis(meal, mode))
}
