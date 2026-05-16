import React, { useEffect, useState } from "react"
import { Link, router } from "expo-router"
import { ScrollView, StyleSheet, Text, View, Pressable } from "react-native"
import { PrimaryButton } from "../components"
import { MAP_PROVINCE_TOTAL, PROVINCES, getProvinceMeta } from "../constants/provinces"
import { getMealTypeLabel, useBodyPuzzleStore } from "../stores/bodyPuzzleStore"
import { colors, radius, spacing } from "../styles/tokens"
import type { MealRecord, MealType } from "../types/meal"

const filters: Array<"all" | MealType | "unrated"> = ["all", "breakfast", "lunch", "dinner", "snack", "unrated"]

export function HistoryScreen() {
  const meals = useBodyPuzzleStore((state) => state.meals)
  const analyses = useBodyPuzzleStore((state) => state.analyses)
  const feedbacks = useBodyPuzzleStore((state) => state.feedbacks)
  const setActiveMeal = useBodyPuzzleStore((state) => state.setActiveMeal)
  const hydratePersistedData = useBodyPuzzleStore((state) => state.hydratePersistedData)
  const [view, setView] = useState<"calendar" | "map">("calendar")
  const [filter, setFilter] = useState<(typeof filters)[number]>("all")
  const [selectedProvince, setSelectedProvince] = useState<string>()

  useEffect(() => {
    void hydratePersistedData()
  }, [hydratePersistedData])

  const filteredMeals = meals.filter((meal) => {
    if (filter === "all") return true
    if (filter === "unrated") return !meal.feedbackId
    return meal.mealType === filter
  })
  const calendarDays = buildCalendarDays(filteredMeals)
  const selectedDayMeals = filteredMeals.filter((meal) => isSameLocalDay(new Date(meal.createdAt), new Date()))
  const provinceStats = buildProvinceStats(meals)
  const unlockedCount = provinceStats.length
  const selectedProvinceStats = provinceStats.find((item) => item.province === selectedProvince) ?? provinceStats[0]

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
            <Text style={styles.calendarMeta}>已打卡 {countLoggedDays(filteredMeals)} 天</Text>
          </View>
          <View style={styles.calendarGrid}>
            {calendarDays.map((day, index) => {
              const hasMeal = day.meals.length > 0
              const isToday = day.date ? isSameLocalDay(day.date, new Date()) : false
              return (
                <View key={`${day.label}-${index}`} style={[styles.dayCell, hasMeal && styles.dayCellDone, isToday && styles.dayCellToday, day.empty && styles.dayCellEmpty]}>
                  <Text style={[styles.dayText, hasMeal && styles.dayTextDone, isToday && styles.dayTextToday]}>{day.label}</Text>
                  {hasMeal && <View style={styles.dayDot} />}
                  {day.meals.length > 1 && <Text style={styles.dayBadge}>{day.meals.length}</Text>}
                </View>
              )
            })}
          </View>
          <Text style={styles.sectionLabel}>今日的记录</Text>
          <View style={styles.listCard}>
            {(selectedDayMeals.length ? selectedDayMeals : filteredMeals).map((meal) => {
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
                    <Text style={styles.mealMeta}>{getMealTypeLabel(meal.mealType)} · {meal.cuisine ?? analysis?.cuisine ?? "家常菜"}</Text>
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
          <Text style={styles.mapSub}>已解锁 {unlockedCount} / {MAP_PROVINCE_TOTAL} 个省份菜系</Text>
          <View style={styles.mapSurface}>
            {PROVINCES.map((province) => {
              const stats = provinceStats.find((item) => item.province === province.id)
              const unlocked = Boolean(stats)
              return (
                <Pressable
                  key={province.id}
                  disabled={!unlocked}
                  style={[
                    styles.provinceBlock,
                    {
                      left: `${(province.x / 400) * 100}%`,
                      top: `${(province.y / 340) * 100}%`,
                      width: `${(province.w / 400) * 100}%`,
                      height: `${(province.h / 340) * 100}%`
                    },
                    unlocked && styles.provinceUnlocked
                  ]}
                  onPress={() => setSelectedProvince(province.id)}
                >
                  <Text style={[styles.provinceLabel, unlocked && styles.provinceLabelUnlocked]}>{province.w >= 40 ? province.id : ""}</Text>
                  {unlocked && <Text style={styles.provinceEmoji}>{province.emoji}</Text>}
                  {stats && stats.count > 1 && <Text style={styles.provinceCount}>{stats.count}</Text>}
                </Pressable>
              )
            })}
          </View>
          <View style={styles.statRow}>
            <Stat value={String(unlockedCount)} label="已解锁菜系" tone="brand" />
            <Stat value={String(MAP_PROVINCE_TOTAL - unlockedCount)} label="待探索" tone="plain" />
            <Stat value={String(meals.length)} label="总记录餐" tone="green" />
          </View>
          {selectedProvinceStats ? (
            <View style={styles.provinceDetail}>
              <Text style={styles.sectionLabel}>{selectedProvinceStats.cuisine} · {selectedProvinceStats.province}</Text>
              {selectedProvinceStats.meals.map((meal) => (
                <Pressable
                  key={meal.id}
                  style={styles.provinceMealRow}
                  onPress={() => {
                    setActiveMeal(meal.id)
                    router.push("/detail")
                  }}
                >
                  <Text style={styles.provinceMealIcon}>{getProvinceMeta(selectedProvinceStats.province)?.emoji ?? "🍽️"}</Text>
                  <View style={styles.mealBody}>
                    <Text style={styles.mealTitle}>{meal.mealCategory ?? "这一餐"}</Text>
                    <Text style={styles.mealMeta}>{getMealTypeLabel(meal.mealType)} · {formatShortDate(meal.createdAt)}</Text>
                  </View>
                  <Text style={styles.provinceArrow}>›</Text>
                </Pressable>
              ))}
            </View>
          ) : null}
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

function buildCalendarDays(meals: MealRecord[]) {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const days: Array<{ label: string; date?: Date; meals: MealRecord[]; empty?: boolean }> = []

  for (let index = 0; index < firstDay; index += 1) {
    days.push({ label: "", meals: [], empty: true })
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day)
    days.push({
      label: String(day),
      date,
      meals: meals.filter((meal) => isSameLocalDay(new Date(meal.createdAt), date))
    })
  }

  return days
}

function countLoggedDays(meals: MealRecord[]) {
  return new Set(meals.map((meal) => localDateKey(new Date(meal.createdAt)))).size
}

function buildProvinceStats(meals: MealRecord[]) {
  const grouped = new Map<string, { province: string; cuisine: string; count: number; meals: MealRecord[] }>()
  meals.forEach((meal) => {
    if (!meal.province || meal.province === "全国" || meal.province === "境外") return
    const current = grouped.get(meal.province)
    if (current) {
      current.count += 1
      current.meals.push(meal)
      return
    }
    grouped.set(meal.province, {
      province: meal.province,
      cuisine: meal.cuisine ?? getProvinceMeta(meal.province)?.cuisine ?? "地方菜",
      count: 1,
      meals: [meal]
    })
  })
  return Array.from(grouped.values()).sort((a, b) => b.count - a.count)
}

function isSameLocalDay(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate()
}

function localDateKey(date: Date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`
}

function formatShortDate(value: string) {
  const date = new Date(value)
  return `${date.getMonth() + 1}月${date.getDate()}日`
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
    gap: spacing.md,
    minHeight: 178,
    alignItems: "stretch",
    paddingBottom: spacing.xs
  },
  filterPill: {
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: 44,
    minWidth: 72,
    minHeight: 170,
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
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
  dayCellEmpty: {
    opacity: 0
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
  dayTextToday: {
    color: colors.brand
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: 2,
    backgroundColor: colors.success
  },
  dayBadge: {
    position: "absolute",
    top: 2,
    right: 4,
    minWidth: 14,
    borderRadius: radius.pill,
    paddingHorizontal: 3,
    color: colors.textInverse,
    fontSize: 9,
    fontWeight: "900",
    textAlign: "center",
    backgroundColor: colors.brand
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
  mapSurface: {
    position: "relative",
    height: 330,
    borderRadius: radius.lg,
    marginVertical: spacing.lg,
    overflow: "hidden",
    backgroundColor: "#EDF8FD"
  },
  provinceBlock: {
    position: "absolute",
    borderWidth: 1,
    borderColor: "rgba(122,110,102,.18)",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,254,249,.72)"
  },
  provinceUnlocked: {
    borderColor: colors.brand,
    backgroundColor: colors.brand
  },
  provinceLabel: {
    color: colors.textSecondary,
    fontSize: 9,
    fontWeight: "700"
  },
  provinceLabelUnlocked: {
    color: colors.textInverse
  },
  provinceEmoji: {
    marginTop: 1,
    fontSize: 12
  },
  provinceCount: {
    position: "absolute",
    top: -7,
    right: -5,
    minWidth: 18,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    color: colors.textInverse,
    fontSize: 10,
    fontWeight: "900",
    textAlign: "center",
    backgroundColor: colors.warning
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
  },
  provinceDetail: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    marginTop: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surfaceRaised
  },
  provinceMealRow: {
    flexDirection: "row",
    gap: spacing.md,
    alignItems: "center",
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border
  },
  provinceMealIcon: {
    width: 34,
    fontSize: 24,
    textAlign: "center"
  },
  provinceArrow: {
    color: colors.textMuted,
    fontSize: 24,
    fontWeight: "700"
  }
})
