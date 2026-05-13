import React, { useEffect } from "react"
import { router, useLocalSearchParams } from "expo-router"
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { getLevelLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"

export function AnalysisScreen() {
  const params = useLocalSearchParams<{ mock?: string }>()
  const activeMealId = useBodyPuzzleStore((state) => state.activeMealId)
  const analyzeActiveMeal = useBodyPuzzleStore((state) => state.analyzeActiveMeal)
  const startActiveMeal = useBodyPuzzleStore((state) => state.startActiveMeal)
  const addAnalysisCorrection = useBodyPuzzleStore((state) => state.addAnalysisCorrection)
  const meal = useBodyPuzzleStore((state) => state.meals.find((item) => item.id === state.activeMealId))
  const analysis = useBodyPuzzleStore((state) => state.analyses.find((item) => item.mealId === state.activeMealId))

  useEffect(() => {
    if (activeMealId && !analysis && meal?.status !== "analysis_failed") {
      if (params.mock === "low") analyzeActiveMeal("low_confidence")
      else if (params.mock === "failed") analyzeActiveMeal("failed")
      else analyzeActiveMeal()
    }
  }, [activeMealId, analysis, analyzeActiveMeal, meal?.status, params.mock])

  if (!activeMealId) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>还没有餐食</Text>
        <Text style={styles.description}>请先创建一条模拟餐食记录。</Text>
        <PrimaryButton title="去拍图记录" onPress={() => router.replace("/record")} />
      </View>
    )
  }

  if (meal?.status === "analysis_failed") {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.spinner}>⚠</Text>
        <Text style={styles.title}>AI 分析失败</Text>
        <Text style={styles.description}>模拟分析暂时失败。你可以重试、换一张图，或用 mock 结果继续。</Text>
        <PrimaryButton title="重新分析" onPress={() => analyzeActiveMeal()} />
        <PrimaryButton title="重新选择照片" onPress={() => router.replace("/record")} />
        <Pressable style={styles.recoverButton} onPress={() => analyzeActiveMeal("low_confidence")}>
          <Text style={styles.recoverText}>用模拟结果继续</Text>
        </Pressable>
      </View>
    )
  }

  if (!analysis) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.spinner}>🔍</Text>
        <Text style={styles.loadingTitle}>识别餐图结构</Text>
        <Text style={styles.description}>正在用模拟数据快速分析这张餐图</Text>
        <View style={styles.stepTrack}>
          <View style={styles.stepDone} />
          <View style={styles.stepTodo} />
        </View>
      </View>
    )
  }

  const riskLevel = analysis.oilBurdenLevel === "high" || analysis.stapleLevel === "high" ? "medium" : "low"

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.badgeRow}>
        <Text style={styles.sourceBadge}>模拟数据</Text>
        <View style={styles.badgeGroup}>
          {analysis.confidence === "low" && <Text style={styles.lowBadge}>低置信</Text>}
          <Text style={[styles.riskBadge, riskLevel === "medium" && styles.riskBadgeWarning]}>{riskLevel === "medium" ? "⚡ 中等" : "✓ 低风险"}</Text>
        </View>
      </View>

      <View style={styles.titleBlock}>
        <Text style={styles.dishTitle}>{analysis.dishName}</Text>
        <Text style={styles.keyLine}>{analysis.structureSummary}</Text>
      </View>

      <View style={styles.riskTrack}>
        <View style={[styles.riskBar, riskLevel === "medium" && styles.riskMedium]} />
      </View>

      <View style={styles.adviceBox}>
        <Text style={styles.adviceText}>{analysis.eatingAdvice.join(" ")}</Text>
        {analysis.confidence === "low" && <Text style={styles.lowNote}>{analysis.imageQualityNote ?? "图片信息不完整，结果只作轻参考。"}</Text>}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>餐食组成</Text>
        <InfoRow label="主食" value={getLevelLabel(analysis.stapleLevel)} />
        <InfoRow label="蛋白" value={getLevelLabel(analysis.proteinLevel)} />
        <InfoRow label="蔬菜纤维" value={getLevelLabel(analysis.vegetableFiberLevel)} />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>饮食建议</Text>
        <Text style={styles.cardText}>基于照片判断，先不假装懂你。吃完后的反馈会用来校验这次预测。</Text>
        {analysis.feedbackFocus.map((item) => (
          <Text style={styles.focusItem} key={item}>· {item}</Text>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>修正识别结果</Text>
        <Text style={styles.cardText}>修正会保存为 diff，不覆盖原始 mock 分析。</Text>
        <View style={styles.correctionActions}>
          <Pressable
            style={styles.correctionButton}
            onPress={() => addAnalysisCorrection({ field: "dishName", aiValue: analysis.dishName, userValue: "黄焖鸡米饭" })}
          >
            <Text style={styles.correctionText}>菜名改为黄焖鸡米饭</Text>
          </Pressable>
          <Pressable
            style={styles.correctionButton}
            onPress={() => addAnalysisCorrection({ field: "portionLevel", aiValue: analysis.portionLevel, userValue: "high" })}
          >
            <Text style={styles.correctionText}>份量改为偏多</Text>
          </Pressable>
        </View>
        {meal?.corrections.length ? (
          <View style={styles.correctionList}>
            {meal.corrections.map((correction) => (
              <Text style={styles.correctionItem} key={correction.id}>
                · {correction.field}: {correction.aiValue} → {correction.userValue}
              </Text>
            ))}
          </View>
        ) : null}
      </View>

      <View style={styles.tagRow}>
        <Text style={styles.tag}>主食偏多</Text>
        <Text style={styles.tag}>少蔬菜</Text>
      </View>

      <Text style={styles.note}>吃完记得回来打分 🙂</Text>
      <PrimaryButton
        title="好的，去吃了 ✓"
        onPress={() => {
          startActiveMeal()
          router.push("/feedback")
        }}
      />
    </ScrollView>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.md,
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
  spinner: {
    fontSize: 32,
    textAlign: "center"
  },
  title: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center"
  },
  loadingTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "800",
    textAlign: "center"
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center"
  },
  stepTrack: {
    flexDirection: "row",
    gap: spacing.sm
  },
  stepDone: {
    flex: 1,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.brand
  },
  stepTodo: {
    flex: 1,
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: colors.border
  },
  recoverButton: {
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  recoverText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "800"
  },
  badgeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  sourceBadge: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.textMuted,
    fontSize: 10
  },
  badgeGroup: {
    flexDirection: "row",
    gap: spacing.sm,
    alignItems: "center"
  },
  lowBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.danger,
    fontSize: 12,
    fontWeight: "800",
    backgroundColor: colors.dangerSurface
  },
  riskBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.successSurface
  },
  riskBadgeWarning: {
    color: colors.warning,
    backgroundColor: colors.warningSurface
  },
  titleBlock: {
    marginTop: spacing.xs
  },
  dishTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "700",
    lineHeight: 30
  },
  keyLine: {
    marginTop: spacing.sm,
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20
  },
  riskTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border
  },
  riskBar: {
    width: "34%",
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.success
  },
  riskMedium: {
    width: "66%",
    backgroundColor: colors.warning
  },
  adviceBox: {
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.surface
  },
  adviceText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21
  },
  lowNote: {
    marginTop: spacing.sm,
    color: colors.danger,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "700"
  },
  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: "800",
    marginBottom: spacing.sm
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 13
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "700"
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 21
  },
  focusItem: {
    marginTop: spacing.sm,
    color: colors.brand,
    fontSize: 13,
    fontWeight: "700"
  },
  correctionActions: {
    gap: spacing.sm,
    marginTop: spacing.md
  },
  correctionButton: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background
  },
  correctionText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800"
  },
  correctionList: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: spacing.md,
    paddingTop: spacing.md
  },
  correctionItem: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm
  },
  tag: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    color: colors.warning,
    fontSize: 12,
    fontWeight: "700",
    backgroundColor: colors.warningSurface
  },
  note: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center"
  }
})
