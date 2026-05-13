# Phase 2: MVP 2.0 计划推荐

来源：`docs/02-master-blueprint.md` 的 `MVP 2.0 — 计划推荐`。

## 阶段目标

基于 MVP 1.0 的记录和回访数据，生成个性化周计划，并让用户看到计划执行情况与实际身体反馈之间的关系。

## 前置条件

- 用户 complete_meals >= 7。
- MVP 1.0 数据闭环已稳定。
- dish、nutrition、feedback、daily_checkins 数据质量满足验收。

## Sprint 7: 偏好模型

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T7-01 | DishScore 计算 | `compute_dish_score(user_id)`，写入 `dish_scores` |
| T7-02 | 推荐卡算法升级 | 有个人评分时按 DishScore 推荐，低置信度回退规则引擎 |
| T7-03 | 营养目标计算 | `compute_daily_target(profile)`，写入 `nutrition_targets` |

## Sprint 8: 计划生成

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T8-01 | 周计划生成接口 | `POST /v1/plan/generate`，写入 `meal_plans` 和 `plan_slots` |
| T8-02 | 计划界面 | 7 天 x 3 餐周视图、备选菜、换菜持久化 |

## Sprint 9: 执行追踪

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T9-01 | 餐次关联计划 | 记录餐次时自动匹配当日 plan_slot |
| T9-01b | 执行状态追踪 | eaten / swapped / skipped 状态 |
| T9-02 | 实时营养缺口 | 当日 consumed vs target 进度 |

## Sprint 10: 洞察报告

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T10-01 | 每周身体报告生成 | `weekly_reports`，计划执行率与身体反馈对比 |
| T10-02 | 报告界面 | 首页展示周报卡片 |

## 非目标

- 不做 3.0 BodyPattern。
- 不做 Health Connect。
- 不做履约或采购。

## 关联验收

见 `docs/acceptance/phase-2-mvp-2-acceptance.md`。
