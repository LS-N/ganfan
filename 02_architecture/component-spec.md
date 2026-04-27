# 通用组件规范

## 1. BaseCard

用途：承载页面主要模块。

状态：

- default
- selected
- warning
- danger
- disabled

## 2. MealCard

用途：展示早餐/午餐/晚餐/加餐状态。

字段：

- mealType
- status
- calories
- score
- summary

交互：

- 未记录：点击进入记录页
- 已记录：点击进入详情页

## 3. PrimaryButton

用途：主操作。

状态：

- default
- disabled
- loading

规则：

- 页面只允许一个最核心主按钮
- 保存类按钮必须有 loading 状态

## 4. EmptyState

用途：空状态。

字段：

- title
- description
- actionText
- action

## 5. Toast

用途：轻反馈。

类型：

- success
- warning
- error
- info

## 6. SegmentTabs

用途：分段切换。

场景：

- 餐次选择
- 今日/历史切换
- 状态筛选

## 7. InputField

用途：输入食物、备注、目标。

状态：

- default
- focused
- error
- disabled
