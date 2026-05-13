import React, { useEffect, useState } from "react"
import { Link, router } from "expo-router"
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native"
import { PrimaryButton } from "../components"
import { getMealTypeLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"
import type { MealType } from "../types/meal"

const filters: Array<"all" | MealType | "unrated"> = ["all", "breakfast", "lunch", "dinner", "snack", "unrated"]

export function HistoryScreen() {
  const meals = useBodyPuzzleStore((state) => state.meals)
  const analyses = useBodyPuzzleStore((state) => state.analyses)
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const setActiveMeal = useBodyPuzzleStore((state) => state.setActiveMeal)
  const hydratePersistedData = useBodyPuzzleStore((state) => state.hydratePersistedData)
  const [view, setView] = useState<"calendar" | "map">("calendar")
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")

  useEffect(() => {
    void hydratePersistedData()
  }, [hydratePersistedData])

  const filteredMeals = meals.filter((meal) => {
    if (filter === "all") return true
    if (filter === "unrated") return !meal.feedbackId
    return meal.mealType === filter
  })

  if (!meals.length) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>📋</Text>
        <Text style={styles.emptyText}>还没有餐次记录</Text>
        <Link href="/record" asChild>
          <PrimaryButton title="记录第一餐" />
        </Link>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.segment}>
        <Pressable style={[styles.segmentButton, view === "calendar" && styles.segmentActive]} onPress={() => setView("calendar")}>
          <Text style={[styles.segmentText, view === "calendar" && styles.segmentTextActive]}>📅 打卡日历</Text>
        </Pressable>
        <Pressable style={[styles.segmentButton, view === "map" && styles.segmentActive]} onPress={() => setView("map")}>
          <Text style={[styles.segmentText, view === "map" && styles.segmentTextActive]}>🗺️ 菜系地图</Text>
        </Pressable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
        {filters.map((item) => (
          <Pressable key={item} style={[styles.filterPill, filter === item && styles.filterActive]} onPress={() => setFilter(item)}>
            <Text style={[styles.filterText, filter === item && styles.filterTextActive]}>{getFilterLabel(item)} {getFilterCount(item, meals)}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {view === "calendar" ? (
        <>
          <View style={styles.calendarHead}>
            <Text style={styles.calendarTitle}>{new Date().getFullYear()}年{new Date().getMonth() + 1}月</Text>
            <Text style={styles.calendarMeta}>已打卡 {Math.min(meals.length, 7)} 天</Text>
          </View>
          <View style={styles.calendarGrid}>
            {Array.from({ length: 28 }, (_, index) => {
              const hasMeal = index >= 21 - Math.min(filteredMeals.length, 7) && index < 21
              return (
                <View key={index} style={[styles.dayCell, hasMeal && styles.dayCellDone, index === 20 && styles.dayCellToday]}>
                  <Text style={[styles.dayText, hasMeal && styles.dayTextDone]}>{index + 1}</Text>
                  {hasMeal && <View style={styles.dayDot} />}
                </View>
              )
            })}
          </View>
          <Text style={styles.sectionLabel}>今日的记录</Text>
          <View style={styles.listCard}>
            {filteredMeals.map((meal) => {
              const analysis = analyses.find((item) => item.id === meal.analysisId)
              const feedback = feedbacks.find((item) => item.id === meal.feedbackId)
              return (
                <Pressable
                  style={styles.mealRow}
                  key={meal.id}
                  onPress={() => {
                    setActiveMeal(meal.id)
                    router.push("/detail")
                  }}
                >
                  <View style={styles.mealAvatar}><Text style={styles.mealAvatarText}>🍱</Text></View>
                  <View style={styles.mealBody}>
                    <Text style={styles.mealTitle}>{meal.mealCategory ?? "这一餐"}</Text>
                    <Text style={styles.mealMeta}>{getMealTypeLabel(meal.mealType)} · 家常菜</Text>
                    <Text style={styles.mealSub}>{analysis?.structureSummary ?? "待分析"}</Text>
                  </View>
                  <Text style={[styles.feelText, feedback ? styles.feelDone : styles.feelPending]}>{feedback ? "😊 已反馈" : "未打分"}</Text>
                </Pressable>
              )
            })}
          </View>
        </>
      ) : (
        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>美食版图</Text>
          <Text style={styles.mapSub}>已解锁 3 / 31 个省份菜系</Text>
          <View style={styles.fakeMap}>
            <Text style={styles.fakeMapText}>粤菜 · 川菜 · 鲁菜</Text>
          </View>
          <View style={styles.statRow}>
            <Stat value="3" label="已解锁菜系" tone="brand" />
            <Stat value="28" label="待探索" tone="plain" />
            <Stat value={String(meals.length)} label="总记录餐" tone="green" />
          </View>
        </View>
      )}
    </ScrollView>
  )
}

function getFilterLabel(filter: (typeof filters)[number]) {
  const labels = {
    all: "全部",
    breakfast: "早饭",
    lunch: "午饭",
    dinner: "晚饭",
    snack: "加餐",
    unrated: "未打分"
  }
  return labels[filter]
}

function getFilterCount(filter: (typeof filters)[number], meals: Array<{ mealType: MealType; feedbackId?: string }>) {
  if (filter === "all") return meals.length
  if (filter === "unrated") return meals.filter((meal) => !meal.feedbackId).length
  return meals.filter((meal) => meal.mealType === filter).length
}

function Stat({ value, label, tone }: { value: string; label: string; tone: "brand" | "plain" | "green" }) {
  return (
    <View style={[styles.stat, tone === "brand" && styles.statBrand, tone === "green" && styles.statGreen]}>
      <Text style={[styles.statValue, tone === "brand" && styles.statValueBrand, tone === "green" && styles.statValueGreen]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
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
  empty: {
    flex: 1,
    gap: spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
    backgroundColor: colors.background
  },
  emptyIcon: {
    fontSize: 48
  },
  emptyText: {
    color: colors.textSecondary,
    fontSize: 14
  },
  segment: {
    flexDirection: "row",
    borderRadius: radius.pill,
    padding: spacing.xs,
    backgroundColor: colors.border
  },
  segmentButton: {
    flex: 1,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center"
  },
  segmentActive: {
    backgroundColor: colors.surface
  },
  segmentText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: "600"
  },
  segmentTextActive: {
    color: colors.textPrimary
  },
  filterRow: {
    gap: spacing.sm,
    paddingBottom: spacing.xs
  },
  filterPill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface
  },
  filterActive: {
    borderColor: colors.brand,
    backgroundColor: colors.brand
  },
  filterText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "700"
  },
  filterTextActive: {
    color: "#FFFFFF"
  },
  calendarHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center"
  },
  calendarTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: "700"
  },
  calendarMeta: {
    color: colors.textSecondary,
    fontSize: 12
  },
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs
  },
  dayCell: {
    width: "13.1%",
    aspectRatio: 1,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center"
  },
  dayCellDone: {
    backgroundColor: colors.border
  },
  dayCellToday: {
    borderWidth: 1.5,
    borderColor: colors.brand,
    backgroundColor: colors.brandSurface
  },
  dayText: {
    color: colors.textMuted,
    fontSize: 13
  },
  dayTextDone: {
    color: colors.textPrimary,
    fontWeight: "700"
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    backgroundColor: colors.success
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1
  },
  listCard: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface
  },
  mealRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  mealAvatar: {
    width: 60,
    height: 60,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background
  },
  mealAvatarText: {
    fontSize: 24
  },
  mealBody: {
    flex: 1
  },
  mealTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: "700"
  },
  mealMeta: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 12
  },
  mealSub: {
    marginTop: spacing.xs,
    color: colors.textMuted,
    fontSize: 12
  },
  feelText: {
    fontSize: 11,
    fontWeight: "700"
  },
  feelDone: {
    color: colors.success
  },
  feelPending: {
    color: colors.brand
  },
  mapCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface
  },
  mapTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center"
  },
  mapSub: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: "center"
  },
  fakeMap: {
    minHeight: 220,
    borderRadius: radius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: spacing.lg,
    backgroundColor: colors.background
  },
  fakeMapText: {
    color: colors.brand,
    fontSize: 15,
    fontWeight: "800"
  },
  statRow: {
    flexDirection: "row",
    gap: spacing.md
  },
  stat: {
    flex: 1,
    borderRadius: radius.md,
    alignItems: "center",
    padding: spacing.md,
    backgroundColor: colors.background
  },
  statBrand: {
    backgroundColor: colors.brandSurface
  },
  statGreen: {
    backgroundColor: colors.successSurface
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: "800"
  },
  statValueBrand: {
    color: colors.brand
  },
  statValueGreen: {
    color: colors.success
  },
  statLabel: {
    marginTop: spacing.xs,
    color: colors.textSecondary,
    fontSize: 11
  }
})
