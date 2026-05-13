export type ServiceMode = "mock" | "real" | "hybrid"

export function getServiceMode(env = process.env.EXPO_PUBLIC_SERVICE_MODE): ServiceMode {
  if (env === "real" || env === "hybrid" || env === "mock") return env
  return "hybrid"
}

export function hasSupabaseConfig(env = process.env) {
  return Boolean(env.EXPO_PUBLIC_SUPABASE_URL && env.EXPO_PUBLIC_SUPABASE_ANON_KEY)
}

export function hasAiEndpoint(env = process.env) {
  return Boolean(env.EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT)
}

export function shouldUseRealServices(env = process.env) {
  const mode = getServiceMode(env.EXPO_PUBLIC_SERVICE_MODE)
  if (mode === "mock") return false
  return hasSupabaseConfig(env)
}
