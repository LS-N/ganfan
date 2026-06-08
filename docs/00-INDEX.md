# 文档索引

本文件只做导航，不定义产品范围、不新增任务、不改写蓝图。开发范围以 `docs/02-master-blueprint.md` 和对应阶段开发文档为准。

## 总蓝图

- `docs/02-master-blueprint.md`：唯一长期**产品**蓝图（产品视角：做什么 / 为谁做 / 为什么）。覆盖 Sprint 0 到 MVP 5.0。技术实现细节已拆分到 `docs/architecture/` 下专题文档。

## 工程架构文档

> **AI 接手开发任务时**：先查 `docs/architecture/README.md`「三、按问题找文档」，按改动类型定位必读的专题文档，**不得跳过直接写代码**。架构地图是 L2+ 任务的强制前置步骤。

- `docs/architecture/data-architecture.md`：三层数据架构 + 完整 Schema + 履约智能横向契约 + AI 数据复利飞轮
- `docs/architecture/api-architecture.md`：内部 API 规范 + MCP Server 对外能力边界（capability 清单 + OAuth scope）
- `docs/architecture/model-architecture.md`：AI 服务层 + Provider 抽象 + Prompt 版本化 + 评估 + 降级策略
- `docs/architecture/observability.md`：AI 成本控制 + 错误报警 + 用户行为埋点（Phase 1 上线红线）
- `docs/architecture/ui-system.md`：色彩/字体/间距 token + 基础组件规范 + 复合组件清单
- `docs/architecture/type-architecture.md`：TypeScript 类型契约 + Zustand Store 接口 + 类型同步规则
- `docs/architecture/security-architecture.md`：Supabase Auth + 完整 RLS + FastAPI 安全 + 密钥管理 + MCP OAuth scope
- `docs/architecture/engineering-architecture.md`：系统架构图 + 技术栈 + 仓库结构 + CI/CD + 开发规范
- `docs/architecture/agent-architecture.md`：三层 Agent 系统（对外能力层/用户面/后端群）+ 渐进路径

## 商业基线

- `docs/business/subscription-plan.md`：付费订阅方案——30 天免费 + 三档订阅、转化钩子、拉新续费。
- `docs/business/cost-model.md`：六阶段开发+运营成本模型（人力=¥0 前提）、滚动供养模型。
- `docs/business/break-even-monitoring.md`：盈亏平衡监测——单位经济、四指标、心跳仪表盘、Agent 自动响应与三级预警。

## AI 工作手册

- `docs/01-ai-working-manual.md`：AI 开发流程、文档使用顺序、禁止事项、交付检查。
- `AGENTS.md`：仓库根级强约束，保持精简，指向本工作手册。

## 开发 SOP

- `docs/development-sop/LATEST.md`：项目无关的“需求到开发交付”标准 SOP，包含需求澄清、原型确认、产品评估、工程入场、前置资源 Gate、阶段开发、验收、交接和提交规则。
- `docs/development-sop/README.md`：SOP 方案库说明和更新规则。

## 当前工作与追踪

- `docs/CURRENT_WORK.md`：当前阶段、当前 Sprint、当前任务、阻塞项和下一步。
- `docs/TASK_LOG.md`：所有 Agent 开始/结束开发记录。任何开发都必须先登记、结束时补记录。
- `docs/lessons/LESSONS_INDEX.md`：可复用经验教训索引。后续 AI 遇到问题时先按关键词检索，确认同类问题后复用已验证方案。

## 资源与密钥索引

- `docs/resources/RESOURCE_REGISTRY.md`：当前唯一资源索引，记录外部账号、密钥、token、设备、数据集、本机工具的变量名、存放位置、状态和验证方式，但不记录真实密钥。
- `docs/resources/README.md`：资源索引目录说明和安全规则。

## 默认原型

- `docs/prototype/README.md`：原型目录说明。
- `docs/prototype/meal-agent-product-prototype.html`：默认产品原型入口。
- `docs/prototype/page-flow.md`：页面流转参考。
- `docs/prototype/confirmed-screens.md`：已确认页面参考。

## 阶段开发文档

- `docs/phases/phase-0-foundation.md`：Sprint 0，工程底座与基础组件库。
- `docs/phases/phase-1-mvp-1-record-awareness.md`：MVP 1.0，记录感知。
- `docs/phases/phase-2-mvp-2-plan-recommendation.md`：MVP 2.0，计划推荐。
- `docs/phases/phase-3-mvp-3-goal-intervention.md`：MVP 3.0，目标干预。
- `docs/phases/phase-4-mvp-4-health-integration.md`：MVP 4.0，健康整合。
- `docs/phases/phase-5-mvp-5-fulfillment-community.md`：MVP 5.0，用户履约。

## 阶段验收文档

- `docs/acceptance/phase-0-acceptance.md`
- `docs/acceptance/phase-1-mvp-1-acceptance.md`
- `docs/acceptance/phase-2-mvp-2-acceptance.md`
- `docs/acceptance/phase-3-mvp-3-acceptance.md`
- `docs/acceptance/phase-4-mvp-4-acceptance.md`
- `docs/acceptance/phase-5-mvp-5-acceptance.md`

## 历史验收资料

- `docs/acceptance/phase-2-service-acceptance-report.md`：早期 Phase 2 service 验收报告，已保留为历史参考。
- `docs/acceptance/phase-2-rls-checklist.sql`：早期 RLS 检查 SQL，后续需按 `docs/02-master-blueprint.md` 重新校准。

## 归档

`_archive/` 下内容只供历史参考，不驱动当前开发。
