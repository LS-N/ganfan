import type { DrawCard } from "../types/meal"
import { mockDrawCardRepository } from "./mockRepositories"
import type { DrawCardRepository } from "./repositoryTypes"
import { authService } from "./authService"
import { getSupabaseClient } from "./supabaseClient"

type DrawCardRow = {
  id: string
  type: DrawCard["type"]
  title: string
  reason: string
  risk: string | null
  source: string
  action: string
  accepted: boolean | null
  decided_at: string | null
  created_at: string
}

export function drawCardToRow(card: DrawCard, userId: string, reportId?: string) {
  return {
    user_id: userId,
    report_id: reportId ?? null,
    type: card.type,
    title: card.title,
    reason: card.reason,
    risk: card.risk ?? null,
    source: card.source,
    action: card.action,
    accepted: card.accepted ?? null,
    decided_at: card.decidedAt ?? null
  }
}

export function drawCardFromRow(row: DrawCardRow): DrawCard {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    reason: row.reason,
    risk: row.risk ?? undefined,
    source: row.source,
    action: row.action,
    accepted: row.accepted ?? undefined,
    decidedAt: row.decided_at ?? undefined,
    description: row.action
  }
}

export function createDrawCardRepository(): DrawCardRepository {
  return {
    async saveDrawCards(cards, userIdInput, reportId) {
      const client = getSupabaseClient()
      if (!client) return mockDrawCardRepository.saveDrawCards(cards, userIdInput, reportId)

      const userId = userIdInput ?? (await authService.getUserId())
      const { data, error } = await client.from("draw_cards").insert(cards.map((card) => drawCardToRow(card, userId, reportId))).select("*").returns<DrawCardRow[]>()
      if (error || !data) return mockDrawCardRepository.saveDrawCards(cards, userId, reportId)
      return data.map(drawCardFromRow)
    },
    async updateDecision(cardId, accepted) {
      const client = getSupabaseClient()
      if (!client) return mockDrawCardRepository.updateDecision(cardId, accepted)

      const { data, error } = await client
        .from("draw_cards")
        .update({ accepted, decided_at: new Date().toISOString() })
        .eq("id", cardId)
        .select("*")
        .single<DrawCardRow>()
      if (error || !data) return mockDrawCardRepository.updateDecision(cardId, accepted)
      return drawCardFromRow(data)
    }
  }
}

export const drawCardRepository = createDrawCardRepository()
