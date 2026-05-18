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
import {
  localAnalysisRepository,
  localDailyCheckinRepository,
  localFeedbackRepository,
  localMealImageRepository,
  localMealRepository,
  localProfileRepository,
  localWeightRepository
} from "./localFirstRepositories"

export function getProfileRepository() {
  if (getServiceMode() === "mock") return mockProfileRepository
  if (!shouldUseRealServices()) return localProfileRepository
  return createProfileRepository()
}

export function getMealRepository() {
  if (getServiceMode() === "mock") return mockMealRepository
  if (!shouldUseRealServices()) return localMealRepository
  return createMealRepository()
}

export function getStorageService() {
  if (!shouldUseRealServices()) return mockStorageService
  if (getServiceMode() === "mock") return mockStorageService
  return createStorageService()
}

export function getAnalysisRepository() {
  if (!shouldUseRealServices()) return localAnalysisRepository
  return createAnalysisRepository()
}

export function getAiMealAnalysisService() {
  return createAiMealAnalysisService()
}

export function getFeedbackRepository() {
  if (!shouldUseRealServices()) return localFeedbackRepository
  return createFeedbackRepository()
}

export function getReportRepository() {
  return createReportRepository()
}

export function getDrawCardRepository() {
  return createDrawCardRepository()
}

export function getDailyCheckinRepository() {
  return localDailyCheckinRepository
}

export function getWeightRepository() {
  return localWeightRepository
}

export function getMealImageRepository() {
  return localMealImageRepository
}

export { authService } from "./authService"
