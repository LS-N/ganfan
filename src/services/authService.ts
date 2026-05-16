import { mockAuthService } from "./mockRepositories"
import type { AuthService } from "./repositoryTypes"
import { getSupabaseClient } from "./supabaseClient"

export class AuthRequiredError extends Error {
  constructor() {
    super("auth_required")
    this.name = "AuthRequiredError"
  }
}

export function createSupabaseAuthService(): AuthService {
  return {
    async getSessionUserId() {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.getSessionUserId()

      const { data } = await client.auth.getSession()
      return data.session?.user.id
    },
    async getUserId() {
      const userId = await this.getSessionUserId()
      if (!userId) throw new AuthRequiredError()
      return userId
    },
    async sendPhoneOtp(phone) {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.sendPhoneOtp(phone)

      const { error } = await client.auth.signInWithOtp({
        phone: normalizePhoneNumber(phone),
        options: {
          shouldCreateUser: true
        }
      })
      if (error) throw new Error(error.message || "phone_otp_send_failed")
    },
    async verifyPhoneOtp(phone, token) {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.verifyPhoneOtp(phone, token)

      const { data, error } = await client.auth.verifyOtp({
        phone: normalizePhoneNumber(phone),
        token: token.trim(),
        type: "sms"
      })
      if (error || !data.user?.id) throw new Error(error?.message || "phone_otp_verify_failed")
      return data.user.id
    },
    async signOut() {
      const client = getSupabaseClient()
      if (!client) return mockAuthService.signOut()

      const { error } = await client.auth.signOut()
      if (error) throw new Error(error.message || "sign_out_failed")
    }
  }
}

export function normalizePhoneNumber(input: string) {
  const value = input.trim().replace(/[^\d+]/g, "")
  if (!value) return value
  if (value.startsWith("+")) return value

  const digits = value.replace(/[^\d]/g, "")
  if (/^1\d{10}$/.test(digits)) return `+86${digits}`
  if (/^86(1\d{10})$/.test(digits)) return `+${digits}`
  if (/^0086(1\d{10})$/.test(digits)) return `+86${digits.slice(4)}`
  return value
}

export const authService = createSupabaseAuthService()
