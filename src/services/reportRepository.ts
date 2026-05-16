import type { BodyPuzzlePattern, DrawCard, Report } from "../types/meal"
import { mockReportRepository } from "./mockRepositories"
import type { ReportRepository } from "./repositoryTypes"
import { authService } from "./authService"
import { getSupabaseClient } from "./supabaseClient"

type ReportRow = {
  id: string
  user_id: string
  status: Report["status"]
  start_date: string
  end_date: string
  sample_size: number
  patterns: BodyPuzzlePattern[]
  safe_foods: string[]
  risk_combos: string[]
  next_week_suggestion: string[]
  generated_at: string
}

export function reportToRow(report: Report, userId = report.userId) {
  return {
    user_id: userId,
    status: report.status,
    start_date: report.startDate,
    end_date: report.endDate,
    sample_size: report.sampleSize,
    patterns: report.patterns,
    safe_foods: report.safeFoods,
    risk_combos: report.riskCombos,
    next_week_suggestion: report.nextWeekSuggestion
  }
}

export function reportFromRow(row: ReportRow, drawCards: DrawCard[] = []): Report {
  return {
    id: row.id,
    userId: row.user_id,
    status: row.status,
    startDate: row.start_date,
    endDate: row.end_date,
    sampleSize: row.sample_size,
    patterns: row.patterns ?? [],
    safeFoods: row.safe_foods ?? [],
    riskCombos: row.risk_combos ?? [],
    nextWeekSuggestion: row.next_week_suggestion ?? [],
    drawCards,
    generatedAt: row.generated_at,
    effectiveMealCount: row.sample_size,
    riskCombinations: row.risk_combos ?? [],
    nextWeekSuggestions: row.next_week_suggestion ?? [],
    drawCardRules: drawCards,
    createdAt: row.generated_at
  }
}

export function createReportRepository(): ReportRepository {
  return {
    async saveReport(report) {
      const client = getSupabaseClient()
      if (!client) return mockReportRepository.saveReport(report)

      const userId = await authService.getUserId()
      const { data, error } = await client.from("body_puzzle_reports").insert(reportToRow(report, userId)).select("*").single<ReportRow>()
      if (error || !data) throw new Error(error?.message || "report_save_failed")
      return reportFromRow(data, report.drawCards)
    },
    async getLatestReport(userIdInput) {
      const client = getSupabaseClient()
      if (!client) return mockReportRepository.getLatestReport()

      const userId = userIdInput ?? (await authService.getSessionUserId())
      if (!userId) return undefined
      const { data, error } = await client
        .from("body_puzzle_reports")
        .select("*")
        .eq("user_id", userId)
        .order("generated_at", { ascending: false })
        .limit(1)
        .maybeSingle<ReportRow>()
      if (error || !data) return undefined
      return reportFromRow(data)
    }
  }
}

export const reportRepository = createReportRepository()
