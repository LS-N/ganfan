import type { Analysis, AnalysisCorrection, BodyPuzzleReport, DailyCheckin, DrawCard, Feedback, MealImage, MealRecord, MealSource, MealStatus, MealType, Profile, WeightLog } from "../types/meal"

export type CreateMealInput = {
  userId: string
  id?: string
  mealType?: MealType
  source?: MealSource
  photoUri?: string
  photoPath?: string
  mealCategory?: string
  drawCardId?: string
}

export type SaveMealImageInput = {
  mealId: string
  imageType: MealImage["imageType"]
  localUri?: string
  storageUrl?: string
}

export type SaveFeedbackInput = Pick<Feedback, "fullness" | "comfort" | "sleepiness" | "bloating" | "energy" | "priceSatisfaction" | "note"> & {
  mealId: string
  comfortTags?: Feedback["comfortTags"]
  tasteFeedback?: Feedback["tasteFeedback"]
}

export type SaveDailyCheckinInput = Pick<DailyCheckin, "energy" | "digestion" | "satiety"> & {
  userId: string
  date: string
  mealIds: string[]
  isNextDay?: boolean
}

export type MealRepository = {
  createMeal(input: CreateMealInput): Promise<MealRecord>
  updateMealStatus(mealId: string, status: MealStatus): Promise<void>
  updateMeal(meal: MealRecord): Promise<MealRecord>
  listMeals(userId?: string): Promise<MealRecord[]>
  getMeal(mealId: string): Promise<MealRecord | undefined>
}

export type ProfileRepository = {
  getCurrentProfile(): Promise<Profile | undefined>
  saveProfile(profile: Profile): Promise<Profile>
}

export type WeightRepository = {
  saveWeightLog(input: Omit<WeightLog, "id" | "recordedAt"> & { recordedAt?: string }): Promise<WeightLog>
  listWeightLogs(userId?: string): Promise<WeightLog[]>
}

export type AnalysisRepository = {
  saveAnalysis(input: Analysis): Promise<Analysis>
  saveCorrection(input: AnalysisCorrection & { mealId: string; analysisId?: string }): Promise<AnalysisCorrection>
  listAnalyses(userId?: string): Promise<Analysis[]>
  getAnalysisByMeal(mealId: string): Promise<Analysis | undefined>
}

export type FeedbackRepository = {
  saveFeedback(input: SaveFeedbackInput): Promise<Feedback>
  listFeedbacks(userId?: string): Promise<Feedback[]>
}

export type DailyCheckinRepository = {
  saveDailyCheckin(input: SaveDailyCheckinInput): Promise<DailyCheckin>
  listDailyCheckins(userId?: string): Promise<DailyCheckin[]>
  getDailyCheckin(date: string, userId?: string): Promise<DailyCheckin | undefined>
}

export type MealImageRepository = {
  saveMealImage(input: SaveMealImageInput): Promise<MealImage>
  listMealImages(mealId: string): Promise<MealImage[]>
}

export type ReportRepository = {
  saveReport(report: BodyPuzzleReport): Promise<BodyPuzzleReport>
  getLatestReport(userId?: string): Promise<BodyPuzzleReport | undefined>
}

export type DrawCardRepository = {
  saveDrawCards(cards: DrawCard[], userId?: string, reportId?: string): Promise<DrawCard[]>
  updateDecision(cardId: string, accepted: boolean): Promise<DrawCard>
}

export type StorageService = {
  uploadMealPhoto(input: { userId: string; mealId: string; uri: string; kind: "before" | "after" }): Promise<{ path: string; url?: string }>
  createSignedMealPhotoUrl(path: string, expiresInSeconds?: number): Promise<string | undefined>
}

export type AnalyzeMealInput = {
  userId: string
  mealId: string
  imageUrl: string
  mealType: MealType
  profileContext: Pick<Profile, "goal" | "avoidances" | "tastePreferences" | "commonFeelings">
  recentSignals: Array<{
    dishName?: string
    structureSummary?: string
    fullness?: string
    comfort?: string
  }>
}

export type AiMealAnalysisService = {
  analyzeMeal(input: AnalyzeMealInput): Promise<Analysis>
}

export type AuthService = {
  getUserId(): Promise<string>
  signInAnonymously(): Promise<string>
}
