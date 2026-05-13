import { createProfileRepository } from "./profileRepository"
import { getServiceMode, shouldUseRealServices } from "./serviceMode"
import { createMealRepository } from "./mealRepository"
import { createStorageService } from "./storageService"
import { mockMealRepository, mockProfileRepository, mockStorageService } from "./mockRepositories"
import { createAnalysisRepository } from "./analysisRepository"
import { createAiMealAnalysisService } from "./aiMealAnalysisService"
import { createFeedbackRepository } from "./feedbackRepository"
import { createReportRepository } from "./reportRepository"
import { createDrawCardRepository } from "./drawCardRepository"

export function getProfileRepository() {
  if (!shouldUseRealServices()) return mockProfileRepository
  if (getServiceMode() === "mock") return mockProfileRepository
  return createProfileRepository()
}

export function getMealRepository() {
  if (!shouldUseRealServices()) return mockMealRepository
  if (getServiceMode() === "mock") return mockMealRepository
  return createMealRepository()
}

export function getStorageService() {
  if (!shouldUseRealServices()) return mockStorageService
  if (getServiceMode() === "mock") return mockStorageService
  return createStorageService()
}

export function getAnalysisRepository() {
  return createAnalysisRepository()
}

export function getAiMealAnalysisService() {
  return createAiMealAnalysisService()
}

export function getFeedbackRepository() {
  return createFeedbackRepository()
}

export function getReportRepository() {
  return createReportRepository()
}

export function getDrawCardRepository() {
  return createDrawCardRepository()
}

export { authService } from "./authService"
