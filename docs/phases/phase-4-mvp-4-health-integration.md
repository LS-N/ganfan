# Phase 4: MVP 4.0 健康整合

来源：`docs/02-master-blueprint.md` 的 `MVP 4.0 — 健康整合`。

## 阶段目标

接入健康数据，形成饮食、睡眠、运动、体重的联合分析，并在饭前给出预测。

## 前置条件

- body_pattern.high_confidence_correlations >= 3。
- MVP 3.0 已能稳定生成可解释规律。
- 用户确认 Health Connect / iOS 健康数据接入策略。

## Sprint 15: Health Connect 接入

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T15-01 | Android Health Connect 权限 | 睡眠、步数、运动权限申请与授权引导 |
| T15-02 | 健康数据同步 | `health_data` 每日同步，date 唯一 |

## Sprint 16: 全维度身体画像

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T16-01 | 健康数据关联展示 | 饮食 + 睡眠 + 运动 + 体重关联视图 |

## Sprint 17: 预测引擎

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T17-01 | 饭前预测算法 | `predict_meal(user_id, candidate_dish, context)` |
| T17-02 | 饭前预测展示 | 分析结果页预测标签，按置信度展示 |

## Sprint 18: 预测反馈回路

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T18-01 | PredictionAccuracy 计算 | 对比预测和回访，更新准确率与置信度 |
| T18-02 | 干预频率控制 | 同类干预 72 小时内不重复触发 |

## Sprint 19: 全流程仪表盘

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T19-01 | 统一健康仪表盘 | 今日计划、精力、体重、断食、预测准确率 |

## 关联验收

见 `docs/acceptance/phase-4-mvp-4-acceptance.md`。
