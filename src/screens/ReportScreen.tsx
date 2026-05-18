import React, { useEffect } from "react"
import { Link } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"

const pieces = [
  { emoji: "😋", label: "喜欢吃这个", hint: "再打几次好评，这块拼图就出来了", unlockAt: 1, color: colors.success },
  { emoji: "🥢", label: "该这么吃", hint: "好评和差评各积累几次，规律就算出来了", unlockAt: 3, color: colors.brand },
  { emoji: "🗺️", label: "口味探索", hint: "再探索 2 种新菜系解锁", unlockAt: 5, color: colors.warning },
  { emoji: "✨", label: "越来越舒服", hint: "记录到 10 餐后解锁", unlockAt: 10, color: colors.success }
]

export function ReportScreen() {
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const report = useBodyPuzzleStore((state) => state.report)
  const generateReport = useBodyPuzzleStore((state) => state.generateReport)
  const feedbackCount = feedbacks.length

  useEffect(() => {
    if (feedbackCount >= 7 && !report) {
      generateReport()
    }
  }, [feedbackCount, generateReport, report])

  if (feedbackCount < 7) {
    return (
      <ScrollView contentContainerStyle={styles.emptyContainer}>
        <View style={styles.emptyContent}>
          <Text style={styles.kicker}>你的身体拼图</Text>
          <Text style={styles.emptyTitle}>还差 <Text style={styles.accent}>{7 - feedbackCount}</Text> 餐{"\n"}首批洞察就出来了</Text>
          <Text style={styles.emptyText}>每一餐都是一块拼图。{"\n"}吃完打个分，身体的秘密慢慢浮现。</Text>
          <Link href="/record?mode=shoot" asChild>
            <PrimaryButton title="📷 去记录这一餐" />
          </Link>
        </View>
      </ScrollView>
    )
  }

  const unlockedCount = pieces.filter((piece) => feedbackCount >= piece.unlockAt).length
  const activeReport = report
  const stageLabel = feedbackCount >= 7 ? "7 天报告" : "初步规律"

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.kicker}>你的身体拼图</Text>
      <Text style={styles.title}>已拼上 <Text style={styles.accent}>{unlockedCount}</Text><Text style={styles.muted}> / 4</Text></Text>

      <View style={styles.grid}>
        {pieces.map((piece) => {
          const unlocked = feedbackCount >= piece.unlockAt
          return (
            <Pressable key={piece.label} style={[styles.piece, unlocked ? { backgroundColor: piece.color } : styles.pieceLocked]}>
              <Text style={styles.pieceEmoji}>{piece.emoji}</Text>
              <Text style={[styles.pieceText, unlocked && styles.pieceTextUnlocked]}>{unlocked ? piece.label : piece.hint}</Text>
            </Pressable>
          )
        })}
      </View>

      <View style={styles.quoteCard}>
        <Text style={styles.quoteLabel}>你的身体说</Text>
        <Text style={styles.quote}>{feedbackCount >= 7 ? "这一周的反馈已经能支持初步报告，但建议仍会标注不确定性。" : `记录了 ${feedbackCount} 餐，规律正在浮现。再记几天，洞察会更准确。`}</Text>
      </View>

      <View style={styles.weeklyCard}>
        <Text style={styles.cardLabel}>{stageLabel}</Text>
        <Text style={styles.cardTitle}>身体反馈正在形成线索</Text>
        {(activeReport?.patterns ?? []).slice(0, 2).map((pattern) => (
          <Text style={styles.cardText} key={pattern.id}>· {pattern.evidence}</Text>
        ))}
        {!activeReport && <PrimaryButton title="生成模拟身体拼图" onPress={generateReport} />}
      </View>

      <View style={styles.weeklyCard}>
        <Text style={styles.cardLabel}>下周午饭安全牌</Text>
        {(activeReport?.safeFoods ?? ["蛋白质足 + 主食适中 + 少油"]).slice(0, 3).map((item) => (
          <Text style={styles.cardText} key={item}>· {item}</Text>
        ))}
      </View>

      <Link href="/draw-card" asChild>
        <PrimaryButton title="餐前抽卡" />
      </Link>
      <Text style={styles.footer}>基于你的 {feedbackCount} 餐反馈数据 · 不是通用建议</Text>
    </ScrollView>
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
  emptyContainer: {
    flexGrow: 1,
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  emptyContent: {
    flex: 1,
    minHeight: 520,
    justifyContent: "center"
  },
  segmented: {
    flexDirection: "row",
    gap: spacing.sm,
    borderRadius: 18,
    padding: 5,
    backgroundColor: colors.brandSurface
  },
  segmentButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center"
  },
  segmentActive: {
    backgroundColor: colors.surface
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800"
  },
  segmentTextActive: {
    color: colors.brand
  },
  kicker: {
    color: colors.textSecondary,
    fontSize: 13,
    marginBottom: spacing.sm
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40,
    marginBottom: spacing.lg
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 26,
    marginBottom: spacing.xxl
  },
  demoRow: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.lg
  },
  demoButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  demoText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: "700"
  },
  accent: {
    color: colors.brand
  },
  muted: {
    color: colors.textMuted,
    fontSize: 18
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  piece: {
    width: "48.7%",
    aspectRatio: 1,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.sm
  },
  pieceLocked: {
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: colors.border,
    backgroundColor: colors.border
  },
  pieceEmoji: {
    fontSize: 32,
    marginBottom: spacing.sm
  },
  pieceText: {
    color: colors.textMuted,
    fontSize: 10,
    lineHeight: 15,
    textAlign: "center"
  },
  pieceTextUnlocked: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700"
  },
  quoteCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.brand
  },
  quoteLabel: {
    color: "rgba(255,255,255,.65)",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  quote: {
    color: "#FFFFFF",
    fontSize: 17,
    lineHeight: 27,
    fontWeight: "700"
  },
  weeklyCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.sm
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21,
    marginTop: spacing.xs
  },
  footer: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: "center"
  },
  structureHero: {
    marginBottom: spacing.xs
  },
  structureTitle: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: "700",
    lineHeight: 40
  },
  structureSub: {
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 24
  },
  structureCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.brandSurface
  },
  structureInsight: {
    borderRadius: radius.xl,
    padding: 22,
    backgroundColor: colors.successSurface
  },
  structureInsightTitle: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    lineHeight: 34,
    marginBottom: spacing.sm
  }
})
