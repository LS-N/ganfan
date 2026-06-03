# Phase 5: MVP 5.0 用户履约

来源：`docs/02-master-blueprint.md` 第 2564-2622 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 5 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 005：5.0 社区表`
  - 复用 `meal_plans`、`plan_slots`、`weekly_reports`、`predictions`、`prediction_accuracy`、`card_actions`。
- `API 接口规范`：履约、社区聚合、计划转食材、订阅、`/v1/insight/generate?trigger=draw_card` 相关接口边界。
- `饭前抽卡功能规范`：`fulfillment` 阶段规则（执行率过滤+社区加权）、T25-02 冷启动与通用阶段 fallback 的关系。
- `算法与大模型分工`：`grocery.py`、`collaborative.py`、社区菜品画像、冷启动推荐。
- `核心 TypeScript 类型`：CommunityDish、GroceryList、Subscription、FulfillmentOrder 等阶段类型。
- `完整 RLS 策略`：社区聚合数据、用户授权数据、履约数据的访问边界。
- `FastAPI 安全规范`：履约接口、订单状态、第三方平台回调的鉴权与输入验证。
- `UserContext 构建逻辑（builder.py）`：成果报告、食材清单、社区推荐需要的用户上下文。
- `环境变量规范`：第三方采购/配餐平台 key 只能在服务端保存。
- `CI/CD 流水线`：涉及外部平台和后台任务时必须区分沙盒与生产环境。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

用户授权后可通过平台购买食材或订阅配餐，并用社区数据改善冷启动推荐。

## 前置条件

- 平台用户 >= 1000。
- 个人预测准确率 >= 0.65。
- 用户确认采购平台或配餐合作方案。

## Sprint 20: 信任证明

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T20-01 健康成果报告生成 | 3 个月回顾报告页面 | 使用满 90 天后首页引导；展示精力均值变化、体重变化、肠胃改善率、预测准确率 | 有 90 天数据的账号报告数据准确 |

## Sprint 21-22: 食材采购

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T21-01 食材清单从计划生成 | `algorithms/grocery.py plan_to_grocery_list(plan_id)` | 解析 plan_slots 菜品 -> 标准食材列表 -> 按类别聚合 | 5 菜计划生成正确食材清单和份量 |
| T22-01 采购接口对接 | 第三方生鲜 API 对接 | 具体平台由人类决策 D5 确认；一键下单，订单状态追踪 | 沙盒环境下单流程完整 |

## Sprint 23-24: 配餐订阅

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T23-01 配餐方案界面 | 周配餐订阅购买页 | 预览菜单、选择份数、设置配送时间 | 订阅流程完整，数据写入 Supabase |

## Sprint 25-26: 社区层

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T25-01 CommunityDishProfile 聚合 | 后台定时任务 | 每日凌晨聚合所有用户 meal + checkin，按 dish_key 和 segment 分层统计，写 `community_dishes` | 注入 100 个不同用户数据，社区评分计算正确 |
| T25-02 协同过滤推荐（冷启动） | 新用户社区推荐 | <7 天新用户使用 community_dishes，按 profile 匹配最近 segment，返回高分菜 | 新注册用户推荐来自社区数据，有数据来源标注 |
| T25-03 饭前抽卡 fulfillment 阶段 | 升级 `draw_card.py buildCardPoolForState` + `get_recommendation_stage` | 履约历史可追踪时 `get_recommendation_stage` 返回 `fulfillment`；新增执行率过滤层：近4周 plan_slots 中复杂备餐菜执行率<60% 则降权/排除同类菜；跳过率高的菜系整体降权；stable 槽叠加历史高执行率菜 +2 加权；`general` 阶段冷启动 explore 槽优先从 community_dishes 同 segment 高分菜中选（而不是纯随机 fallback）；`card_actions.recommendation_stage` 写入 `fulfillment` | fulfillment 阶段用户抽卡：stable 槽为用户历史执行率最高菜之一；连续跳过某菜系的用户该菜系不出现在 stable/alt 槽；`general` 阶段新用户 explore 槽菜品来自社区同 segment 而非纯随机 |

## 关联验收

见 `docs/acceptance/phase-5-mvp-5-acceptance.md`。
