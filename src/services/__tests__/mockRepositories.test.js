const {
  createMockAnalysisForMeal,
  mockAnalysisRepository,
  mockFeedbackRepository,
  mockMealRepository,
  mockStorageService,
  resetMockRepositoryState
} = require("../mockRepositories")

describe("mock repositories", () => {
  beforeEach(() => {
    resetMockRepositoryState()
  })

  test("creates a meal, saves analysis, correction, and feedback", async () => {
    const meal = await mockMealRepository.createMeal({ userId: "mock-user-001", mealType: "lunch", source: "photo" })
    const analysis = await createMockAnalysisForMeal(meal)
    const correction = await mockAnalysisRepository.saveCorrection({
      mealId: meal.id,
      field: "portionLevel",
      aiValue: "medium",
      userValue: "high",
      correctedAt: new Date().toISOString(),
      id: "test-correction"
    })
    const feedback = await mockFeedbackRepository.saveFeedback({
      mealId: meal.id,
      fullness: "just_right",
      comfort: "comfortable",
      comfortTags: ["comfortable"],
      tasteFeedback: ["tasty"]
    })
    const storedMeal = await mockMealRepository.getMeal(meal.id)

    expect(analysis.source).toBe("mock")
    expect(correction.userValue).toBe("high")
    expect(feedback.mealId).toBe(meal.id)
    expect(storedMeal.corrections).toHaveLength(1)
    expect(storedMeal.feedbackId).toBe(feedback.id)
  })

  test("storage mock exposes a signed URL shape for uploaded meal photos", async () => {
    const uploaded = await mockStorageService.uploadMealPhoto({
      userId: "mock-user-001",
      mealId: "meal-1",
      uri: "file://meal.jpg",
      kind: "before"
    })
    const signedUrl = await mockStorageService.createSignedMealPhotoUrl(uploaded.path)

    expect(uploaded.path).toBe("mock-user-001/meals/meal-1/before.jpg")
    expect(signedUrl).toBe("mock://signed-mock-user-001/meals/meal-1/before.jpg")
  })
})
