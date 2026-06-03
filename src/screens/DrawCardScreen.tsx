import React, { useEffect, useState } from "react"
import { router } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { BaseCard, PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, spacing } from "../styles/tokens"
import type { DrawCardRule } from "../types/meal"

export function DrawCardScreen() {
  const report = useBodyPuzzleStore((state) => state.report)
  const feedbackCount = useBodyPuzzleStore((state) => state.feedbacks.length)
  const generateReport = useBodyPuzzleStore((state) => state.generateReport)
  const markCardDecision = useBodyPuzzleStore((state) => state.markCardDecision)

  useEffect(() => {
    if (!report && feedbackCount >= 7) {
      generateReport()
    }
  }, [feedbackCount, generateReport, report])

  if (!report) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>还不能生成推荐卡</Text>
        <Text style={styles.description}>{feedbackCount < 7 ? "推荐卡必须来自你的已记录规律。至少完成 7 餐反馈后再试。" : "正在准备你的餐前卡片。"}</Text>
        <PrimaryButton title="去看报告" onPress={() => router.replace("/report")} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>下一餐推荐卡</Text>
      <Text style={styles.description}>基于 Phase 1 已记录反馈给下一餐一个轻提示，不做周计划托管。</Text>

      {report.drawCardRules.map((card) => (
        <CardRule key={card.id} card={card} onAccept={() => markCardDecision(card.id, true)} onSkip={() => markCardDecision(card.id, false)} />
      ))}
    </ScrollView>
  )
}

type CardRuleProps = {
  card: DrawCardRule
  onAccept: () => void
  onSkip: () => void
}

function CardRule({ card, onAccept, onSkip }: CardRuleProps) {
  const [flipped, setFlipped] = useState(false)
  const badge = card.type === "safe" ? "安全牌" : "风险牌"
  return (
    <Pressable accessibilityRole="button" onPress={() => setFlipped((current) => !current)}>
      <BaseCard style={[styles.flipCard, card.type === "risk" && styles.riskCard]}>
        {!flipped ? (
          <View style={styles.cardFace}>
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, card.type === "risk" && styles.riskBadge]}>{badge}</Text>
              <Text style={styles.stageLabel}>{card.recommendationStageLabel ?? "通用推荐"}</Text>
            </View>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.tapHint}>点击翻开</Text>
          </View>
        ) : (
          <View style={styles.cardFace}>
            <View style={styles.badgeRow}>
              <Text style={[styles.badge, card.type === "risk" && styles.riskBadge]}>{badge}</Text>
              <Text style={styles.stageLabel}>{card.recommendationStageLabel ?? "通用推荐"}</Text>
            </View>
            <Text style={styles.cardText}>{card.action}</Text>
            <Text style={styles.reason}>{card.recommendationReason ?? card.reason}</Text>
            {card.risk ? <Text style={styles.riskText}>不确定性：{card.risk}</Text> : null}
            <Text style={styles.meta}>置信度：{card.confidenceLevel === "high" ? "高" : card.confidenceLevel === "medium" ? "中" : "低"} · 解锁条件：{card.unlockRequirement ?? "记录后可用"}</Text>
            <Text style={styles.source}>{(card.recommendationSources ?? [card.source]).join(" · ")}</Text>
            {card.accepted === undefined ? (
              <View style={styles.actions}>
                <PrimaryButton title="采纳" onPress={onAccept} />
                <PrimaryButton title="跳过" onPress={onSkip} />
              </View>
            ) : (
              <Text style={styles.result}>{card.accepted ? "已采纳" : "已跳过"}</Text>
            )}
          </View>
        )}
      </BaseCard>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    padding: spacing.lg,
    paddingBottom: 90,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    gap: spacing.lg,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700"
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22
  },
  badge: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm
  },
  stageLabel: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  flipCard: {
    minHeight: 250,
    borderColor: colors.brand,
    justifyContent: "center"
  },
  riskCard: {
    borderColor: colors.warning,
    backgroundColor: colors.warningSurface
  },
  cardFace: {
    minHeight: 190,
    justifyContent: "center"
  },
  riskBadge: {
    color: colors.warning
  },
  cardTitle: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  cardText: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 16,
    lineHeight: 24
  },
  reason: {
    marginTop: spacing.md,
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 20
  },
  meta: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18
  },
  riskText: {
    marginTop: spacing.sm,
    color: colors.warning,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700"
  },
  source: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20
  },
  tapHint: {
    marginTop: spacing.xl,
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "600"
  },
  actions: {
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  result: {
    marginTop: spacing.lg,
    color: colors.brand,
    fontSize: 15,
    fontWeight: "700"
  }
})
