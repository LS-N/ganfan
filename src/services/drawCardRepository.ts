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
  // Phase 2+ 槽位字段（card_actions 对齐字段）
  slot: string | null
  slot_label: string | null
  badge: string | null
  dish: string | null
  advice: string | null
  recommendation_stage: string | null
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
    decided_at: card.decidedAt ?? null,
    // 槽位系统字段（Phase 2 DishScore 和 body_puzzle 推荐质量追踪必需）
    slot: card.slot ?? null,
    slot_label: card.slotLabel ?? null,
    badge: card.badge ?? null,
    dish: card.dish ?? null,
    advice: card.advice ?? null,
    recommendation_stage: card.recommendationStage ?? null
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
    description: row.action,
    slot: (row.slot as DrawCard["slot"]) ?? undefined,
    slotLabel: (row.slot_label as DrawCard["slotLabel"]) ?? undefined,
    badge: row.badge ?? undefined,
    dish: row.dish ?? undefined,
    advice: row.advice ?? undefined,
    recommendationStage: (row.recommendation_stage as DrawCard["recommendationStage"]) ?? undefined
  }
}

export function createDrawCardRepository(): DrawCardRepository {
  return {
    async saveDrawCards(cards, userIdInput, reportId) {
      const client = getSupabaseClient()
      if (!client) return mockDrawCardRepository.saveDrawCards(cards, userIdInput, reportId)

      const userId = userIdInput ?? (await authService.getUserId())
      const { data, error } = await client.from("draw_cards").insert(cards.map((card) => drawCardToRow(card, userId, reportId))).select("*").returns<DrawCardRow[]>()
      if (error || !data) throw new Error(error?.message || "draw_cards_save_failed")
      return data.map((row, index) => ({ ...cards[index], ...drawCardFromRow(row) }))
    },
    async updateDecision(cardId, accepted) {
      const client = getSupabaseClient()
      if (!client) return mockDrawCardRepository.updateDecision(cardId, accepted)

      const userId = await authService.getUserId()
      const { data, error } = await client
        .from("draw_cards")
        .update({ accepted, decided_at: new Date().toISOString() })
        .eq("id", cardId)
        .eq("user_id", userId)
        .select("*")
        .single<DrawCardRow>()
      if (error || !data) throw new Error(error?.message || "draw_card_update_failed")
      return drawCardFromRow(data)
    }
  }
}

export const drawCardRepository = createDrawCardRepository()
