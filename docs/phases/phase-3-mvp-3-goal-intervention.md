# Phase 3: MVP 3.0 目标干预

来源：`docs/02-master-blueprint.md` 第 2391-2479 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 3 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 003：3.0 模式表`
  - 复用 `Migration 002：2.0 计划表`
  - 复用 `weight_logs`、`daily_checkins`、`meal_feedback` 等 1.0 数据。
- `API 接口规范`：`/v1/pattern/compute`、`/v1/plan/generate`、目标干预相关接口。
- `功能解锁阈值`：`complete_meals >= 21`、`checkin_rate >= 0.6` 等解锁条件。
- `算法与大模型分工`：`body_pattern.py`、`fasting.py`、目标偏离干预、规律反哺计划。
- `核心 TypeScript 类型`：BodyPattern、Correlation、Intervention、Fasting 状态等阶段类型。
- `Zustand Store 接口定义`：身体规律、断食、计划状态与现有数据的关系。
- `完整 RLS 策略`：`body_patterns`、`weekly_reports`、`interventions` 及相关表的访问控制。
- `UserContext 构建逻辑（builder.py）`：规律计算和干预生成必须使用的上下文。
- `FastAPI 安全规范`：模式计算、计划生成、干预接口的鉴权和限流。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

用户看到可解释的个人饮食规律，断食/减重干预可用。

## 前置条件

- `complete_meals >= 21`
- `checkin_rate >= 0.6`

## Sprint 11: BodyPattern 计算

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T11-01 相关性计算算法 | `algorithms/body_pattern.py compute_body_pattern(user_id)` | 遍历 FEATURES x METRICS；分有/无特征两组 checkin 计算均值差；`abs(delta)>0.25` 且 sample >=3 保存；confidence=min(sample_size,20)/20；upsert `body_patterns` 且 version 递增 | 注入已知相关测试数据，算法检测出正确相关性 |
| T11-02 BodyPattern 触发机制 | checkin 提交后检查解锁条件 | 满足条件异步调用 `/v1/pattern/compute` | 第 21 条带回访记录提交后 `body_patterns` 有数据 |
| T11-03 规律可视化 | `components/BodyPuzzle.tsx` 升级版 | 展示相关性列表、置信度进度条、样本数量，右上角显示“基于 X 次记录” | 显示置信度与数据库一致 |

## Sprint 12: 断食模块

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T12-01 断食计划生成 | `algorithms/fasting.py recommend_fasting(user_id)` | 分析 avg_meal_gap、体重趋势、肠胃敏感度，推荐 16:8 / 16:8 宽松版 / 先建立规律 | 不同用户特征对应不同推荐方案 |
| T12-02 断食计时界面 | 断食模块页面 | 进食窗口计时，禁食剩余时间，开始/结束断食，超出窗口提醒，状态持久化 | 计时准确，App 重启后恢复 |
| T12-03 断食状态嵌入拍照流程 | `camera.tsx` 拍照保存前检查断食状态 | 断食禁食期弹确认：打破断食/只是记录/取消 | 弹窗出现；选 A 状态 ended 且 meal 写入；选 B 状态不变；非断食无额外步骤 |

## Sprint 13: 体重/目标管理

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T13-01 热量目标动态调整 | 基于 goal + weight_trend 更新 `nutrition_targets` | 减重目标 + 体重上升时降低热量目标 500kcal | 体重连续 3 周上升，目标自动降低 |
| T13-02 目标偏离干预 | 干预检测逻辑 + 首页提示卡 | 热量连续 3 天超标或体重趋势反向时写 `interventions` | 注入超标数据，interventions 有记录，首页提示出现 |

## Sprint 14: 规律反哺计划

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T14-01 规律反哺计划生成 | 升级 `/v1/plan/generate` | 消费 body_pattern，排除与已知负向相关性匹配的菜品 | 有“辛辣 -> 肠胃不适”规律的用户，计划中无辛辣菜 |

## 关联验收

见 `docs/acceptance/phase-3-mvp-3-acceptance.md`。
