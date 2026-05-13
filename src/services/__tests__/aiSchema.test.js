const { parseAiAnalysisJson } = require("../aiSchema")

describe("aiSchema", () => {
  test("normalizes unknown enum values and trims arrays", () => {
    const analysis = parseAiAnalysisJson(
      {
        dishName: "",
        structureSummary: "一定会长胖",
        stapleLevel: "extreme",
        proteinLevel: "medium",
        vegetableFiberLevel: "low",
        oilLevel: "heavy",
        portionLevel: "huge",
        riskHints: ["a", "b", "c", "d", "e", "f"],
        eatingAdvice: ["先吃菜"],
        feedbackFocus: ["困不困"],
        confidence: "unclear"
      },
      "meal-1"
    )

    expect(analysis.dishName).toBe("这一餐")
    expect(analysis.structureSummary).not.toContain("一定")
    expect(analysis.stapleLevel).toBe("unknown")
    expect(analysis.portionLevel).toBe("unknown")
    expect(analysis.riskHints).toHaveLength(5)
    expect(analysis.confidence).toBe("low")
  })
})
