const { getServiceMode, hasSupabaseConfig, shouldUseRealServices } = require("../serviceMode")

describe("serviceMode", () => {
  test("defaults to hybrid", () => {
    expect(getServiceMode(undefined)).toBe("hybrid")
  })

  test("uses mock when explicitly configured", () => {
    expect(getServiceMode("mock")).toBe("mock")
    expect(shouldUseRealServices({ EXPO_PUBLIC_SERVICE_MODE: "mock", EXPO_PUBLIC_SUPABASE_URL: "url", EXPO_PUBLIC_SUPABASE_ANON_KEY: "key" })).toBe(false)
  })

  test("requires both Supabase env values before using real services", () => {
    expect(hasSupabaseConfig({ EXPO_PUBLIC_SUPABASE_URL: "url" })).toBe(false)
    expect(shouldUseRealServices({ EXPO_PUBLIC_SERVICE_MODE: "real", EXPO_PUBLIC_SUPABASE_URL: "url", EXPO_PUBLIC_SUPABASE_ANON_KEY: "key" })).toBe(true)
  })
})
