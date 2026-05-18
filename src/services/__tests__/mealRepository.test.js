const { mealFromRow, mealToRow } = require("../mealRepository")

describe("mealRepository mappers", () => {
  test("maps create input to database row without leaking raw image data", () => {
    const row = mealToRow({ userId: "user-1", mealType: "dinner", source: "photo", photoPath: "user-1/meals/meal-1/before.jpg" }, "user-1")

    expect(row.user_id).toBe("user-1")
    expect(row.meal_type).toBe("dinner")
    expect(row.photo_path).toBe("user-1/meals/meal-1/before.jpg")
  })

  test("maps joined meal row to app meal record", () => {
    const meal = mealFromRow({
      id: "meal-1",
      user_id: "user-1",
      meal_type: "lunch",
      status: "completed",
      source: "photo",
      photo_path: "user-1/meals/meal-1/before.jpg",
      photo_taken_at: "2026-05-13T00:00:00.000Z",
      meal_started_at: null,
      feedback_due_at: null,
      completed_at: "2026-05-13T01:00:00.000Z",
      draw_card_id: null,
      created_at: "2026-05-13T00:00:00.000Z",
      updated_at: "2026-05-13T01:00:00.000Z",
      analyses: [],
      analysis_corrections: [],
      feedbacks: []
    })

    expect(meal.id).toBe("meal-1")
    expect(meal.photoUri).toBe("user-1/meals/meal-1/before.jpg")
    expect(meal.corrections).toEqual([])
  })
})
