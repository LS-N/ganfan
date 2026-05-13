# Phase 1: MVP 1.0 记录感知

来源：`docs/02-master-blueprint.md` 的 `MVP 1.0 — 记录感知`。

## 阶段目标

让用户完整走通“注册/建档 -> 拍照或记录餐次 -> AI 分析 -> 饭后反馈 -> 每日回访 -> 历史查看 -> 首页建议”的饮食记录闭环。

## 前置条件

- Phase 0 完成。
- 用户确认是否迁移到蓝图目标结构。
- 用户确认是否启用原生依赖：`expo-sqlite`、`expo-camera`、`expo-image-manipulator`、`expo-notifications`。
- Supabase 项目、AI 服务密钥、营养数据来源等资源按蓝图准备。

## Sprint 1: 用户体系与数据层

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T1-01 | 用户登录与 Auth 接入 | Supabase Auth 客户端、登录状态、退出登录 |
| T1-02 | 个人档案 | profile 表/本地模型、建档页、编辑页 |
| T1-03 | 本地优先数据层 | SQLite schema、repository、同步边界 |
| T1-04 | Supabase 核心表 | users、profiles、weight_logs、meals 等基础表 |
| T1-05 | 营养向量库初始化 | nutrition_items、pgvector、基础 seed 流程 |

## Sprint 2: 餐次记录与 AI 分析

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T2-01 | 拍照记录 | 相机权限、拍照页、图片压缩 |
| T2-02 | 餐次创建 | meals、meal_images 写入 |
| T2-03 | AI 图像识别 | Vision 识别接口、结构化菜品结果 |
| T2-04 | 营养匹配 | 精确匹配 + pgvector 语义搜索 + AI 估算 fallback |
| T2-05 | 分析结果页 | 营养、风险、建议、可修正字段 |

## Sprint 3: 反馈与每日回访

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T3-01 | 饭后反馈 | 摄入比例、饱腹、舒适度、满意度 |
| T3-02 | 每日回访 | energy、digestion、satiety 问卷 |
| T3-03 | 回访关联餐次 | daily_checkins 与 meals 关联 |
| T3-04 | 通知和提醒 | 本地提醒、延迟提醒策略 |

## Sprint 4: 历史记录与个人档案

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T4-01 | 历史列表 | 按日期查看餐次 |
| T4-02 | 单餐详情 | meal、analysis、feedback、image 完整展示 |
| T4-03 | 体重记录 | weight_logs 时序记录 |
| T4-04 | 档案编辑 | profile 完整编辑和保存 |

## Sprint 5: 推荐卡与首页逻辑

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T5-01 | 首页状态机 | 新用户、有记录、待反馈、待回访、已解锁洞察 |
| T5-02 | 推荐卡 | RecoCard、card_actions |
| T5-03 | 规则引擎 | rules.py 或移动端 fallback 规则 |
| T5-04 | 7 天解锁 | complete_meals / checkin 统计 |
| T5-05 | 首批洞察 | first_insight prompt 与展示 |

## Sprint 6: 稳定性与上线准备

| 任务 | 开发目标 | 交付物 |
|---|---|---|
| T6-01 | 离线与同步异常 | 断网可记录、联网后同步 |
| T6-02 | 网络状态 | 离线横幅、错误 toast |
| T6-03 | AI 失败处理 | 重试、换图、模拟结果继续 |
| T6-04 | 性能优化 | 历史列表虚拟化、图片懒加载、查询索引 |
| T6-05 | 错误监控 | Sentry 或等效错误上报 |
| T6-06 | EAS Build | preview / production 配置 |
| T6-07 | 内测分发 | APK 或 TestFlight 内测流程 |

## 关联验收

见 `docs/acceptance/phase-1-mvp-1-acceptance.md`。
