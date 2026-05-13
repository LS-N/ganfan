export async function scheduleFeedbackReminder(mealId: string, delayMinutes = 60) {
  if (process.env.JEST_WORKER_ID) return undefined
  const Notifications = await import("expo-notifications")
  const { status } = await Notifications.requestPermissionsAsync()
  if (status !== "granted") return undefined

  return Notifications.scheduleNotificationAsync({
    content: {
      title: "这餐吃完了吗？",
      body: "花半分钟记一下饱腹和身体感受，身体洞察会更准。",
      data: { mealId, kind: "meal_feedback" }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, delayMinutes * 60)
    }
  })
}
