const { buildMockDrawCards } = require("../mockDrawCardService")
const { createMockMealSeed, createSeedFeedbacks } = require("../mockSeedData")

describe("draw card recommendations", () => {
  test("builds three stage-aware cards when body puzzle data is available", () => {
    const meals = createMockMealSeed(7)
    const feedbacks = createSeedFeedbacks(meals)

    const cards = buildMockDrawCards(meals, feedbacks)

    expect(cards).toHaveLength(3)
    expect(cards[0].recommendationStage).toBe("body_puzzle")
    expect(cards[0].recommendationStageLabel).toBe("身体拼图推荐")
    expect(cards[1].recommendationStage).toBe("feedback")
    expect(cards[2].type).toBe("risk")
    expect(cards[2].recommendationSources).toBeDefined()
    expect(cards[2].confidenceLevel).toBe("medium")
  })

  test("falls back to the general stage when feedback is sparse", () => {
    const meals = createMockMealSeed(3)
    const feedbacks = createSeedFeedbacks(meals).slice(0, 1)

    const cards = buildMockDrawCards(meals, feedbacks)

    expect(cards[0].recommendationStage).toBe("general")
    expect(cards[0].recommendationStageLabel).toBe("通用推荐")
    expect(cards[1].recommendationStage).toBe("general")
  })
})
