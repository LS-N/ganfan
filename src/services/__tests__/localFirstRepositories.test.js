jest.mock("../../db/client", () => {
  const actual = jest.requireActual("../../db/client")
  return {
    ...actual,
    getDatabase: jest.fn()
  }
})

jest.mock("../authService", () => ({
  authService: {
    getSessionUserId: jest.fn(),
    getUserId: jest.fn(),
    sendPhoneOtp: jest.fn(),
    verifyPhoneOtp: jest.fn(),
    signOut: jest.fn()
  }
}))

const { getDatabase } = require("../../db/client")
const { authService } = require("../authService")
const { localAnalysisRepository, localFeedbackRepository, localMealRepository, localProfileRepository } = require("../localFirstRepositories")

describe("localFirstRepositories user isolation", () => {
  const db = {
    getFirstAsync: jest.fn(),
    getAllAsync: jest.fn(),
    runAsync: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
    db.getFirstAsync.mockReset()
    db.getAllAsync.mockReset()
    db.runAsync.mockReset()
    getDatabase.mockResolvedValue(db)
    authService.getSessionUserId.mockResolvedValue("user-1")
  })

  test("filters profile reads by the current user", async () => {
    db.getFirstAsync.mockResolvedValue({
      user_id: "user-1",
      age_range: null,
      gender: "unknown",
      height_cm: 170,
      weight_kg: 60,
      goal: "stable_energy",
      budget_level: "medium",
      avoidances: "[]",
      taste_preferences: "[]",
      common_feelings: "[]",
      created_at: "2026-05-15T00:00:00.000Z",
      updated_at: "2026-05-15T00:00:00.000Z"
    })

    await localProfileRepository.getCurrentProfile()

    expect(db.getFirstAsync).toHaveBeenCalledWith(expect.stringContaining("WHERE user_id = ?"), "user-1")
  })

  test("filters analysis and feedback reads by the current user", async () => {
    db.getAllAsync.mockResolvedValue([])

    await localAnalysisRepository.listAnalyses()
    await localFeedbackRepository.listFeedbacks()

    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM meal_analysis"),
      "user-1"
    )
    expect(db.getAllAsync).toHaveBeenCalledWith(
      expect.stringContaining("FROM meal_feedback"),
      "user-1"
    )
  })

  test("filters meal detail reads by the current user", async () => {
    db.getFirstAsync
      .mockResolvedValueOnce({
        id: "meal-1",
        user_id: "user-1",
        meal_type: "lunch",
        status: "draft",
        source: "photo",
        photo_uri: null,
        dish: null,
        cuisine: null,
        province: null,
        meal_started_at: null,
        feedback_due_at: null,
        completed_at: null,
        created_at: "2026-05-15T00:00:00.000Z",
        updated_at: "2026-05-15T00:00:00.000Z"
      })
      .mockResolvedValueOnce(undefined)
    db.getAllAsync.mockResolvedValue([])

    await localMealRepository.getMeal("meal-1")

    expect(db.getFirstAsync).toHaveBeenCalledWith("SELECT * FROM meals WHERE id = ? AND user_id = ?", "meal-1", "user-1")
  })
})
