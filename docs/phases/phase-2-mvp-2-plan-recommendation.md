# Phase 2: MVP 2.0 计划推荐

来源：`docs/02-master-blueprint.md` 第 2286-2387 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 2 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 002：2.0 计划表`
  - 复用 `Migration 001：1.0 核心表` 中 meals、daily_checkins、meal_feedback 等数据。
- `API 接口规范`：`/v1/plan/generate`、`/v1/insight/generate`、计划/周报相关接口。
- `算法与大模型分工`：`dish_score.py`、营养目标计算、计划生成、周报生成边界。
- `核心 TypeScript 类型`：Plan、PlanSlot、DishScore、NutritionTarget、WeeklyReport 等阶段相关类型。
- `Zustand Store 接口定义`：计划、首页、报告状态与现有 meal/profile store 的关系。
- `完整 RLS 策略`：`meal_plans`、`plan_slots`、`dish_scores`、`nutrition_targets`、`weekly_reports` 的用户隔离。
- `UserContext 构建逻辑（builder.py）`：计划生成和周报必须使用用户记录上下文。
- `Claude Prompt 模板`
  - `Prompt 4：周报生成（T10-01）`
- `FastAPI 安全规范`：计划生成和洞察接口的 JWT、限流、输入验证。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

基于 1.0 数据生成个性化周计划，用户能看到计划 vs 实际对比。

## 前置条件

- 用户 `complete_meals >= 7`。
- MVP 1.0 数据闭环稳定。

## Sprint 7: 偏好模型

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T7-01 DishScore 计算算法 | `algorithms/dish_score.py compute_dish_score(user_id)` | 按 cuisine/tags 分组，聚合 energy/digestion/satiety/satisfaction 均值 + 置信度，upsert `dish_scores`，每次 daily_checkin 后异步重算 | 5 条测试餐次，验证分数计算正确 |
| T7-02 推荐卡算法升级 | 升级 `/v1/insight/generate` | 有 DishScore 时按个人评分排序替代规则排序；置信度 <0.3 时回退规则引擎 | A/B 对比有/无评分时推荐结果差异 |
| T7-03 营养目标计算 | `algorithms/nutrition.py compute_daily_target(profile)` | 基于年龄、性别、身高、体重、目标计算 TDEE 和宏量目标，写 `nutrition_targets` | 不同 profile 的计算结果符合营养学标准 |

## Sprint 8: 计划生成

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T8-01 周计划生成接口 | `POST /v1/plan/generate` | 生成 7 天 x 3 餐候选池，按营养缺口 + DishScore + 多样性评分，写入 `meal_plans` + `plan_slots` | 计划无重复菜系同天出现，满足营养目标 |
| T8-02 计划界面 | `app/plan.tsx` | 周视图网格，每格显示菜品 + 预测评分；长按替换，写 `plan_slots.swapped_to`，保留原推荐 alternatives | 界面渲染正确；换菜后持久化；重开 App 仍显示 |

## Sprint 9: 执行追踪

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T9-01 记录餐次时关联当日计划 | 修改 `insertMeal()` | 同日同餐型自动匹配 plan_slot，写 `executed_meal_id` | 记录午饭后 plan_slots 的 executed_meal_id 有值 |
| T9-01b 计划执行状态追踪 | 计划页状态按钮 | eaten/swapped/skipped；当天 23:59 后未操作自动 skipped；用于周报执行率 | 按计划吃、手动没吃、换菜状态均正确 |
| T9-02 实时营养缺口显示 | 首页或计划页进度 | 实时累计当日 meals nutrition，对比 targets | 记录一餐后营养进度条更新 |

## Sprint 10: 洞察报告

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T10-01 每周身体报告生成 | `POST /v1/insight/generate trigger='weekly_report'` | 每周一检查近 7 天餐次；已有报告不重复；写 `weekly_reports` | 有数据生成报告；无数据不生成不报错；同周二次触发返回已有记录 |
| T10-02 报告界面 | 首页周报卡片 | 每周一次性展示周报 | 周报内容准确，引用数据和数据库一致 |

## 关联验收

见 `docs/acceptance/phase-2-mvp-2-acceptance.md`。
