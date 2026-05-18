const { feedbackFromRow, feedbackToRow } = require("../feedbackRepository")
const { reportFromRow, reportToRow } = require("../reportRepository")
const { drawCardFromRow, drawCardToRow } = require("../drawCardRepository")

describe("feedback/report/draw-card mappers", () => {
  test("maps feedback without private raw payloads", () => {
    const row = feedbackToRow({ mealId: "meal-1", fullness: "just_right", comfort: "comfortable", tasteFeedback: ["tasty"] }, "user-1")
    expect(row.user_id).toBe("user-1")
    expect(row.taste_feedback).toEqual(["tasty"])

    const feedback = feedbackFromRow({
      id: "fb-1",
      meal_id: "meal-1",
      fullness: "just_right",
      comfort: "comfortable",
      sleepiness: null,
      bloating: null,
      energy: null,
      price_satisfaction: null,
      taste_feedback: ["tasty"],
      note: null,
      submitted_at: "2026-05-13T00:00:00.000Z",
      created_at: "2026-05-13T00:00:00.000Z"
    })
    expect(feedback.comfortTags).toEqual(["comfortable"])
  })

  test("maps report and draw card rows", () => {
    const report = reportFromRow({
      id: "report-1",
      user_id: "user-1",
      status: "first_signal",
      start_date: "2026-05-07T00:00:00.000Z",
      end_date: "2026-05-13T00:00:00.000Z",
      sample_size: 3,
      patterns: [],
      safe_foods: ["清爽"],
      risk_combos: ["重油"],
      next_week_suggestion: ["先吃菜"],
      generated_at: "2026-05-13T00:00:00.000Z"
    })
    expect(reportToRow(report, "user-1").sample_size).toBe(3)

    const cardRow = drawCardToRow({ id: "card-1", type: "safe", title: "安全牌", reason: "来自反馈", source: "3餐", action: "先吃菜" }, "user-1", "report-1")
    expect(cardRow.report_id).toBe("report-1")
    expect(drawCardFromRow({ ...cardRow, id: "card-1", accepted: null, created_at: "2026-05-13T00:00:00.000Z" }).description).toBe("先吃菜")
  })
})
