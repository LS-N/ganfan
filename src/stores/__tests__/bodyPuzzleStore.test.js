/* global process */
const { useBodyPuzzleStore } = require("../bodyPuzzleStore")

describe("bodyPuzzleStore", () => {
  beforeEach(() => {
    process.env.EXPO_PUBLIC_SERVICE_MODE = "mock"
    useBodyPuzzleStore.getState().resetMockData()
  })

  test("runs the phase 1 mock meal loop", () => {
    const store = useBodyPuzzleStore.getState()
    const mealId = store.createMockMeal("lunch", "photo")

    useBodyPuzzleStore.getState().analyzeActiveMeal()
    useBodyPuzzleStore.getState().addAnalysisCorrection({ field: "dishName", aiValue: "外卖餐", userValue: "黄焖鸡米饭" })
    useBodyPuzzleStore.getState().startActiveMeal()
    useBodyPuzzleStore.getState().saveFeedback({
      fullness: "just_right",
      comfortTags: ["comfortable"],
      tasteFeedback: ["tasty"],
      priceSatisfaction: "worth_it"
    })

    const state = useBodyPuzzleStore.getState()
    expect(state.activeMealId).toBe(mealId)
    expect(state.analyses).toHaveLength(1)
    expect(state.feedbacks).toHaveLength(1)
    expect(state.meals[0].corrections).toHaveLength(1)
    expect(state.meals[0].status).toBe("feedback_completed")
  })
})
