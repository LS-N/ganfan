import { mockAuthService } from "./mockRepositories"
import type { AuthService } from "./repositoryTypes"
import { getSupabaseClient } from "./supabaseClient"

export function createSupabaseAuthService(): AuthService {
  return {
    async getUserId() {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.getUserId()

      const { data } = await client.auth.getUser()
      if (data.user?.id) return data.user.id
      return this.signInAnonymously()
    },
    async signInAnonymously() {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.signInAnonymously()

      const { data, error } = await client.auth.signInAnonymously()
      if (error || !data.user?.id) return mockAuthService.signInAnonymously()
      return data.user.id
    }
  }
}

export const authService = createSupabaseAuthService()
