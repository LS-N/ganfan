import React, { useEffect } from "react"
import { Link, router } from "expo-router"
import { ScrollView, StyleSheet, Text, View } from "react-native"
import { PrimaryButton } from "../components"
import { getLevelLabel, getMealTypeLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"

export function DetailScreen() {
  const activeMealId = useBodyPuzzleStore((state) => state.activeMealId)
  const meal = useBodyPuzzleStore((state) => state.meals.find((item) => item.id === state.activeMealId))
  const analysis = useBodyPuzzleStore((state) => state.analyses.find((item) => item.mealId === state.activeMealId))
  const feedback = useBodyPuzzleStore((state) => state.feedbacks.find((item) => item.mealId === state.activeMealId))
  const hydratePersistedData = useBodyPuzzleStore((state) => state.hydratePersistedData)

  useEffect(() => {
    void hydratePersistedData()
  }, [hydratePersistedData])

  if (!activeMealId || !meal) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.title}>暂无单餐档案</Text>
        <PrimaryButton title="去记录一餐" onPress={() => router.replace("/record")} />
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{getMealTypeLabel(meal.mealType)}档案</Text>
      <Text style={styles.description}>这页保存餐图、结构分析、修正 diff 和饭后反馈。它会进入身体拼图，但不做医学判断。</Text>

      <View style={styles.photoPlaceholder}>
        <Text style={styles.photoTitle}>模拟餐食照</Text>
        <Text style={styles.photoText}>{meal.mealCategory}</Text>
      </View>

      {analysis ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>结构分析</Text>
          <Text style={styles.cardText}>主食 {getLevelLabel(analysis.stapleLevel)}，蛋白 {getLevelLabel(analysis.proteinLevel)}，蔬菜纤维 {getLevelLabel(analysis.vegetableFiberLevel)}。</Text>
          <Text style={styles.cardText}>{analysis.riskHints[0]}</Text>
          <View style={styles.levelGrid}>
            <Info label="油脂" value={getLevelLabel(analysis.oilLevel)} />
            <Info label="份量" value={getLevelLabel(analysis.portionLevel)} />
            <Info label="置信度" value={analysis.confidence === "low" ? "低，仅供参考" : "较高"} />
          </View>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>分析失败兜底</Text>
          <Text style={styles.cardText}>这餐会保存为待分析，不阻断后续反馈。</Text>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>修正记录</Text>
        {meal.corrections.length > 0 ? (
          meal.corrections.map((correction) => (
            <Text style={styles.cardText} key={correction.id}>
              {correction.field}: {correction.aiValue} → {correction.userValue}
            </Text>
          ))
        ) : (
          <Text style={styles.cardText}>没有修正。后续如果识别不准，会记录 diff，而不是覆盖原始结果。</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>饭后反馈</Text>
        {feedback ? (
          <>
            <View style={styles.levelGrid}>
              <Info label="饱腹" value={getFullnessText(feedback.fullness)} />
              <Info label="身体" value={feedback.comfortTags.map(getComfortText).join("、")} />
              <Info label="价格" value={getPriceText(feedback.priceSatisfaction)} />
            </View>
            <View style={styles.insightBox}>
              <Text style={styles.insightLabel}>即时小洞察</Text>
              <Text style={styles.insightText}>{buildFeedbackInsight(feedback.comfortTags, feedback.fullness)}</Text>
            </View>
          </>
        ) : (
          <Text style={styles.cardText}>还没有反馈。真实版会在饭后 60 分钟提醒，也允许错过后补填。</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>可选饭量校准</Text>
        <Text style={styles.cardText}>饭后剩余量或空盘拍照只作为校准，不影响主流程完成。</Text>
      </View>

      <View style={styles.actions}>
        {!feedback && <PrimaryButton title="补饭后反馈" onPress={() => router.push("/feedback")} />}
        <Link href="/report" asChild>
          <PrimaryButton title="查看身体拼图" />
        </Link>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    gap: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  centerContainer: {
    flex: 1,
    gap: spacing.lg,
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
  photoPlaceholder: {
    minHeight: 180,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: "#EEF7EF"
  },
  photoTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: "700"
  },
  photoText: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 14
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
    fontSize: 18,
    fontWeight: "700"
  },
  cardText: {
    marginTop: spacing.sm,
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22
  },
  levelGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
    marginTop: spacing.md
  },
  infoBox: {
    minWidth: "30%",
    flex: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background
  },
  infoLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    marginBottom: spacing.xs
  },
  infoValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: "800",
    lineHeight: 18
  },
  insightBox: {
    borderRadius: radius.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.brandSurface
  },
  insightLabel: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: spacing.xs
  },
  insightText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 21
  },
  actions: {
    gap: spacing.md
  }
})

function Info({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoBox}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  )
}

function getFullnessText(value: string) {
  if (value === "too_full" || value === "overfull") return "撑"
  if (value === "hungry") return "还饿"
  return "刚好"
}

function getComfortText(value: string) {
  const labels: Record<string, string> = {
    comfortable: "舒服",
    bloated: "胀气",
    sleepy: "困倦",
    energetic: "有精神"
  }
  return labels[value] ?? value
}

function getPriceText(value?: string) {
  if (value === "worth_it" || value === "good") return "值"
  if (value === "expensive" || value === "bad") return "偏贵"
  return "一般"
}

function buildFeedbackInsight(comfortTags: string[], fullness: string) {
  if (comfortTags.includes("sleepy")) return "这餐后出现困倦，后续身体拼图会重点观察主食和油脂组合。"
  if (comfortTags.includes("bloated")) return "这餐后有胀感，后续会和份量、油脂、进食速度一起看。"
  if (comfortTags.includes("energetic") && fullness === "just_right") return "这餐反馈接近理想样本，后续可能进入你的安全餐参考。"
  return "反馈已保存。再积累几餐后，系统会更容易看出你的个人规律。"
}
