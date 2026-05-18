import type { Profile } from "../types/meal"
import { mockProfile } from "./mockSeedData"
import { mockProfileRepository } from "./mockRepositories"
import type { ProfileRepository } from "./repositoryTypes"
import { getSupabaseClient } from "./supabaseClient"
import { authService } from "./authService"

type ProfileRow = {
  user_id: string
  age_range: Profile["ageRange"] | null
  gender: Profile["gender"] | null
  height_cm: number | null
  weight_kg: number | null
  goal: Profile["goal"]
  budget_level: Profile["budgetLevel"] | null
  avoidances: string[] | null
  taste_preferences: string[] | null
  common_feelings: string[] | null
  created_at: string
  updated_at: string
}

export function profileFromRow(row: ProfileRow): Profile {
  const height = row.height_cm ?? mockProfile.height
  const weight = row.weight_kg ?? mockProfile.weight
  return {
    ...mockProfile,
    id: row.user_id,
    ageRange: row.age_range ?? undefined,
    gender: row.gender ?? "unknown",
    heightCm: row.height_cm ?? undefined,
    weightKg: row.weight_kg ?? undefined,
    goal: row.goal,
    budgetLevel: row.budget_level ?? undefined,
    avoidances: row.avoidances ?? [],
    tastePreferences: row.taste_preferences ?? [],
    commonFeelings: row.common_feelings ?? [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    height,
    weight,
    avoidFoods: row.avoidances ?? []
  }
}

export function profileToRow(profile: Profile, userId = profile.id): ProfileRow {
  return {
    user_id: userId,
    age_range: profile.ageRange ?? null,
    gender: profile.gender ?? "unknown",
    height_cm: profile.heightCm ?? profile.height ?? null,
    weight_kg: profile.weightKg ?? profile.weight ?? null,
    goal: profile.goal,
    budget_level: profile.budgetLevel ?? null,
    avoidances: profile.avoidances ?? profile.avoidFoods ?? [],
    taste_preferences: profile.tastePreferences ?? [],
    common_feelings: profile.commonFeelings ?? [],
    created_at: profile.createdAt,
    updated_at: profile.updatedAt
  }
}

export function createProfileRepository(): ProfileRepository {
  return {
    async getCurrentProfile() {
      const client = getSupabaseClient()
      if (!client) return mockProfileRepository.getCurrentProfile()

      const userId = await authService.getSessionUserId()
      if (!userId) return undefined
      const { data, error } = await client.from("profiles").select("*").eq("user_id", userId).maybeSingle<ProfileRow>()
      if (error || !data) return undefined
      return profileFromRow(data)
    },
    async saveProfile(profile) {
      const client = getSupabaseClient()
      if (!client) return mockProfileRepository.saveProfile(profile)

      const userId = await authService.getUserId()
      const row = profileToRow({ ...profile, id: userId, updatedAt: new Date().toISOString() }, userId)
      const { data, error } = await client.from("profiles").upsert(row).select("*").single<ProfileRow>()
      if (error || !data) throw new Error(error?.message || "profile_save_failed")
      return profileFromRow(data)
    }
  }
}

export const profileRepository = createProfileRepository()
