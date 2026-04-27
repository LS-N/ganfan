# 埋点规范

## 1. 原则

埋点只服务于产品判断，不做无意义采集。

## 2. 事件

```text
home_view
record_button_click
meal_record_start
food_add
meal_save_click
meal_save_success
meal_save_fail
meal_detail_view
history_view
ai_advice_view
profile_save
```

## 3. 通用属性

```ts
type TrackingCommon = {
  userId?: string
  appVersion: string
  platform: "ios" | "android"
  channel: "development" | "preview" | "production"
  timestamp: string
}
```
