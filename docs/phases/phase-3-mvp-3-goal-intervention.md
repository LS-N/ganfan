# Phase 3: MVP 3.0 目标干预

来源：`docs/02-master-blueprint.md` 的 `MVP 3.0 — 目标干预`。

## 阶段目标

让用户看到可解释的个人饮食规律，并基于目标、体重、断食和身体反馈进行轻量干预。

## 前置条件

- complete_meals >= 21。
- checkin_rate >= 0.6。
- MVP 2.0 计划和执行追踪已稳定。

## Sprint 11: BodyPattern 计算

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T11-01 | 相关性计算 | `compute_body_pattern(user_id)`，写入 `body_patterns` |
| T11-02 | 解锁触发 | 回访提交后检查是否达到 3.0 解锁条件 |
| T11-03 | 规律可视化 | BodyPuzzle 展示相关性、置信度、样本数 |

## Sprint 12: 断食模块

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T12-01 | 断食计划推荐 | `recommend_fasting(user_id)` |
| T12-02 | 断食计时界面 | 开始/结束断食、状态持久化 |
| T12-03 | 拍照流程嵌入断食状态 | 断食中拍照确认弹窗和状态处理 |

## Sprint 13: 体重/目标管理

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T13-01 | 热量目标动态调整 | 基于 goal + weight_trend 更新 nutrition_targets |
| T13-02 | 目标偏离干预 | 连续超标或趋势反向时写入 interventions 并提示 |

## Sprint 14: 规律反哺计划

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T14-01 | 规律影响计划生成 | `/v1/plan/generate` 消费 body_pattern，排除负向关联菜品 |

## 关联验收

见 `docs/acceptance/phase-3-mvp-3-acceptance.md`。
