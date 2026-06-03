# Phase 4: MVP 4.0 健康整合

来源：`docs/02-master-blueprint.md` 第 2483-2560 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 4 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 004：4.0 预测表`
  - 复用 `Migration 003：3.0 模式表`
  - 复用 `health_data`、`predictions`、`prediction_accuracy`、`interventions`。
- `API 接口规范`：`/v1/predict/meal`、`/v1/pattern/compute`、`/v1/insight/generate?trigger=draw_card`、健康数据和预测相关接口。
- `饭前抽卡功能规范`：`body_structure` 阶段规则（健康数据过滤+加权）、`get_recommendation_stage` 新增 `has_health_data_authorized` 判断逻辑。
- `算法与大模型分工`：`predictor.py`、预测反馈回路、干预频率控制。
- `核心 TypeScript 类型`：HealthData、Prediction、PredictionAccuracy、Insight 仪表盘数据类型。
- `Zustand Store 接口定义`：健康数据、预测、仪表盘状态与既有 meal/plan/body pattern 数据的关系。
- `完整 RLS 策略`：`health_data`、`predictions`、`prediction_accuracy`、`interventions` 的隐私边界。
- `FastAPI 安全规范`：健康和预测接口的 JWT、限流、输入验证。
- `环境变量规范`：健康数据、错误监控、外部服务配置不得泄露隐私或密钥。
- `CI/CD 流水线`：涉及 Health Connect / 原生权限时必须考虑重新打包和真机验证。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

健康数据接入，实现饭前预测，用户能看到多维度健康关联。

## 前置条件

- `body_pattern.high_confidence_correlations >= 3`
- 用户确认 Android Health Connect 与 iOS 健康数据策略。

## Sprint 15: Health Connect 接入

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T15-01 Android Health Connect 权限 | READ_SLEEP、READ_STEPS、READ_EXERCISE 权限和健康数据授权引导页 | 申请授权并建立用户可理解的授权流程 | 授权后 `health_data` 能读到睡眠数据 |
| T15-02 健康数据同步 | `utils/healthSync.ts` | 每日同步睡眠/步数/运动，写 `health_data`，date 唯一 | 连接 Health Connect 后，昨天睡眠/步数有数据 |

## Sprint 16: 全维度身体画像

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T16-01 健康数据关联展示 | `app/insight.tsx` 升级 | 展示饮食 + 睡眠 + 运动 + 体重关联，如“昨晚睡眠差 -> 今天消化评分低” | 注入低睡眠 + 低消化评分数据，关联提示出现 |

## Sprint 17: 预测引擎

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T17-01 饭前预测算法 | `algorithms/predictor.py predict_meal(user_id, candidate_dish, context)` | 提取候选菜 features；匹配 body_pattern；健康数据调节；多证据聚合 | 已知相关性 + 候选菜，预测方向正确 |
| T17-02 饭前预测展示 | 分析结果页预测标签 | 有 4.0 解锁且预测置信度 >0.5 时展示；低置信度隐藏 | 置信度低不显示，高时正确显示 |
| T17-03 饭前抽卡 body_structure 阶段 | 升级 `draw_card.py buildCardPoolForState` + `get_recommendation_stage` | Health Connect 授权后 `get_recommendation_stage` 返回 `body_structure`；`buildCardPoolForState` 新增健康数据调节层：睡眠<6h→排除高油高碳菜，步数≥8000→可接受高碳水，运动日→高蛋白+2；只使用已授权且当天有值的字段，无数据字段不参与评分；`card_actions.recommendation_stage` 写入 `body_structure` | Health Connect 授权后抽卡 stage 变为 body_structure；昨晚睡眠<6h 时，stable/alt 槽位无高油高碳菜；无睡眠数据时不触发该过滤；reason 文案引用今日身体状态 |

## Sprint 18: 预测反馈回路

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T18-01 PredictionAccuracy 计算 | 写 `prediction_accuracy` | meal_feedback 提交后对比本餐预测，正确 confidence +0.05，错误 -0.08 | 预测正确上升，错误下降 |
| T18-02 干预频率控制 | 干预去重逻辑 | 检查 `interventions` 最近记录，同类干预 72 小时内不重复 | 连续触发同类干预，第 2 次在 72 小时内不显示 |

## Sprint 19: 全流程仪表盘

| 任务 | 产出 | 关键逻辑 | 测试/验收 |
|---|---|---|---|
| T19-01 统一健康仪表盘 | `app/insight.tsx` 完整版 | 今日计划进度、精力趋势、体重趋势、断食状态、预测准确率 | 所有模块数据准确，空数据状态有占位文案 |

## 关联验收

见 `docs/acceptance/phase-4-mvp-4-acceptance.md`。
