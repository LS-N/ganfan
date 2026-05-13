const { profileFromRow, profileToRow } = require("../profileRepository")
const { mockProfile } = require("../mockSeedData")

describe("profileRepository mappers", () => {
  test("maps app profile fields to Supabase row", () => {
    const row = profileToRow(mockProfile, "user-123")

    expect(row.id).toBe("user-123")
    expect(row.height_cm).toBe(mockProfile.heightCm)
    expect(row.avoidances).toEqual(mockProfile.avoidances)
  })

  test("maps Supabase row back to compatibility profile", () => {
    const profile = profileFromRow({
      id: "user-123",
      age_range: "25_34",
      gender: "unknown",
      height_cm: 170,
      weight_kg: 60,
      goal: "stable_energy",
      budget_level: "medium",
      avoidances: ["太油"],
      taste_preferences: ["清爽"],
      common_feelings: ["sleepy"],
      created_at: "2026-05-13T00:00:00.000Z",
      updated_at: "2026-05-13T00:00:00.000Z"
    })

    expect(profile.id).toBe("user-123")
    expect(profile.height).toBe(170)
    expect(profile.avoidFoods).toEqual(["太油"])
  })
})
