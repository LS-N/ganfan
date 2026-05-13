import { buildMockAnalysis } from "./mockAnalysisService"
import { hasAiEndpoint } from "./serviceMode"
import { parseAiAnalysisJson } from "./aiSchema"
import type { AiMealAnalysisService } from "./repositoryTypes"

export function createAiMealAnalysisService(): AiMealAnalysisService {
  return {
    async analyzeMeal(input) {
      if (!hasAiEndpoint()) {
        return buildMockAnalysis({ id: input.mealId, mealType: input.mealType })
      }

      try {
        const response = await fetch(process.env.EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT as string, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: input.userId,
            mealId: input.mealId,
            imageUrl: input.imageUrl,
            mealType: input.mealType,
            profileContext: input.profileContext,
            recentSignals: input.recentSignals.slice(0, 5)
          })
        })
        if (!response.ok) throw new Error("AI endpoint unavailable")
        return parseAiAnalysisJson(await response.json(), input.mealId)
      } catch {
        return buildMockAnalysis({ id: input.mealId, mealType: input.mealType }, "low_confidence")
      }
    }
  }
}

export const aiMealAnalysisService = createAiMealAnalysisService()
