import { router, Slot, usePathname } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useBodyPuzzleStore } from "../src/stores/bodyPuzzleStore"
import { colors, spacing } from "../src/styles/tokens"

const titles: Record<string, string> = {
  "/": "干饭",
  "/record": "记录这一餐",
  "/analysis": "识别结果",
  "/feedback": "饭后打分",
  "/detail": "本餐详情",
  "/history": "我的记录",
  "/report": "身体",
  "/draw-card": "计划",
  "/profile": "MVP 1.0",
  "/body-profile": "我的档案",
  "/food-profile": "饮食偏好"
}

export default function RootLayout() {
  const pathname = usePathname()
  const profile = useBodyPuzzleStore((state) => state.profile)
  const mealCount = useBodyPuzzleStore((state) => state.meals.length)
  const showChrome = Boolean(profile) || pathname !== "/"
  const showBottomTabs = Boolean(profile) && ["/", "/draw-card", "/report"].includes(pathname)
  const isHome = pathname === "/"
  const isTabRoot = Boolean(profile) && ["/", "/draw-card", "/report"].includes(pathname)

  return (
    <View style={styles.root}>
      {showChrome && (
        <View style={styles.navWrap}>
          <View style={[styles.nav, isHome && styles.homeNav]}>
            {isHome ? (
              <View style={styles.homeLeft}>
                <Pressable style={styles.avatar} onPress={() => router.push("/body-profile")}>
                  <Text style={styles.avatarText}>🍚</Text>
                </Pressable>
                <Pressable style={styles.homeStat} onPress={() => router.push("/history")}>
                  <Text style={styles.homeStatMuted}>⚡</Text>
                  <Text style={styles.homeStatText}>{mealCount}</Text>
                </Pressable>
              </View>
            ) : isTabRoot ? (
              <View style={[styles.backButton, styles.invisibleSlot]}>
                <Text style={styles.backText}>← 返回</Text>
              </View>
            ) : (
              <Pressable style={styles.backButton} onPress={goBack}>
                <Text style={styles.backText}>← 返回</Text>
              </Pressable>
            )}

            <Text style={[styles.navTitle, isHome && styles.invisibleTitle]}>{titles[pathname] ?? "干饭"}</Text>

            <View style={[styles.navRight, isHome && styles.homeNavRight]} />
          </View>
        </View>
      )}

      <View style={styles.content}>
        <Slot />
      </View>

      {showBottomTabs && (
        <View style={styles.tabWrap}>
          <View style={styles.tabbar}>
            <TabButton icon="🏠" label="Today" active={pathname === "/"} onPress={() => router.push("/")} />
            <TabButton icon="📋" label="计划" active={pathname === "/draw-card"} onPress={() => router.push("/draw-card")} />
            <TabButton icon="🧩" label="身体" active={pathname === "/report"} onPress={() => router.push("/report")} />
          </View>
        </View>
      )}
    </View>
  )
}

function TabButton({ icon, label, active, onPress }: { icon: string; label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable style={styles.tabButton} onPress={onPress}>
      <Text style={[styles.tabIcon, active && styles.tabActive]}>{icon}</Text>
      <Text style={[styles.tabLabel, active && styles.tabActive]}>{label}</Text>
    </Pressable>
  )
}

function goBack() {
  if (router.canGoBack()) {
    router.back()
    return
  }
  router.replace("/")
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background
  },
  navWrap: {
    width: "100%",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface
  },
  nav: {
    width: "100%",
    maxWidth: 430,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface
  },
  homeNav: {
    borderBottomWidth: 0
  },
  homeLeft: {
    minWidth: 170,
    flexDirection: "row",
    alignItems: "center",
    gap: 14
  },
  avatar: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSurface
  },
  avatarText: {
    fontSize: 23
  },
  homeStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6
  },
  homeStatText: {
    color: colors.textPrimary,
    fontSize: 21,
    fontWeight: "900"
  },
  homeStatMuted: {
    color: colors.textMuted,
    fontSize: 21,
    fontWeight: "900"
  },
  backButton: {
    minWidth: 88,
    paddingVertical: spacing.sm
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: "700"
  },
  navTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 19,
    fontWeight: "800",
    textAlign: "center"
  },
  invisibleTitle: {
    opacity: 0
  },
  navRight: {
    width: 88,
    alignItems: "flex-end"
  },
  homeNavRight: {
    width: 0
  },
  invisibleSlot: {
    opacity: 0
  },
  content: {
    flex: 1
  },
  tabWrap: {
    width: "100%",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface
  },
  tabbar: {
    width: "100%",
    maxWidth: 430,
    minHeight: 64,
    flexDirection: "row",
    backgroundColor: colors.surface
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 2
  },
  tabIcon: {
    color: colors.textSecondary,
    fontSize: 20,
    lineHeight: 24
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 10,
    fontWeight: "600"
  },
  tabActive: {
    color: colors.brand
  }
})
