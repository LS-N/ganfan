const { normalizePhoneNumber } = require("../authService")

describe("authService phone normalization", () => {
  test("keeps existing E.164 phone numbers", () => {
    expect(normalizePhoneNumber("+8618615775785")).toBe("+8618615775785")
  })

  test("normalizes mainland mobile inputs to E.164", () => {
    expect(normalizePhoneNumber("18615775785")).toBe("+8618615775785")
    expect(normalizePhoneNumber("86 186-1577-5785")).toBe("+8618615775785")
    expect(normalizePhoneNumber("008618615775785")).toBe("+8618615775785")
  })
})
