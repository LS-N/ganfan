import { router, Slot, usePathname } from "expo-router"
import { Pressable, StyleSheet, Text, View } from "react-native"
import { useNetInfo } from "@react-native-community/netinfo"
import { useBodyPuzzleStore } from "../src/stores/bodyPuzzleStore"
import { colors, opacity, radius, size, spacing, typography } from "../src/theme"

const titles: Record<string, string> = {
  "/": "干饭",
  "/record": "记录这一餐",
  "/analysis": "识别结果",
  "/feedback": "饭后打分",
  "/checkin": "每日回访",
  "/detail": "本餐详情",
  "/history": "我的记录",
  "/report": "身体",
  "/draw-card": "推荐",
  "/profile": "MVP 1.0",
  "/body-profile": "我的档案",
  "/food-profile": "饮食偏好"
}

export default function RootLayout() {
  const pathname = usePathname()
  const netInfo = useNetInfo()
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
        {netInfo.isConnected === false && (
          <View style={styles.offlineBanner}>
            <Text style={styles.offlineText}>当前离线，记录会先保存在本机，联网后同步。</Text>
          </View>
        )}
        <Slot />
      </View>

      {showBottomTabs && (
        <View style={styles.tabWrap}>
          <View style={styles.tabbar}>
            <TabButton icon="🏠" label="Today" active={pathname === "/"} onPress={() => router.push("/")} />
            <TabButton icon="📋" label="推荐" active={pathname === "/draw-card"} onPress={() => router.push("/draw-card")} />
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
    maxWidth: size.mobileMaxWidth,
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
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
    gap: spacing.md
  },
  avatar: {
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.brandSurface
  },
  avatarText: {
    fontSize: typography.size.titleLg
  },
  homeStat: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: spacing.xs
  },
  homeStatText: {
    color: colors.textPrimary,
    fontSize: typography.size.titleMd,
    fontWeight: typography.weight.black
  },
  homeStatMuted: {
    color: colors.textMuted,
    fontSize: typography.size.titleMd,
    fontWeight: typography.weight.black
  },
  backButton: {
    minWidth: 88,
    paddingVertical: spacing.sm
  },
  backText: {
    color: colors.textSecondary,
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold
  },
  navTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: typography.size.titleMd,
    fontWeight: typography.weight.bold,
    textAlign: "center"
  },
  invisibleTitle: {
    opacity: opacity.invisible
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
  offlineBanner: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.warningSurface
  },
  offlineText: {
    color: colors.warning,
    fontSize: typography.size.xs,
    fontWeight: typography.weight.semibold
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
    maxWidth: size.mobileMaxWidth,
    minHeight: 64,
    flexDirection: "row",
    backgroundColor: colors.surface
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xxs
  },
  tabIcon: {
    color: colors.textSecondary,
    fontSize: typography.size.titleMd,
    lineHeight: 24
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: typography.size.xxs,
    fontWeight: typography.weight.medium
  },
  tabActive: {
    color: colors.brand
  }
})
