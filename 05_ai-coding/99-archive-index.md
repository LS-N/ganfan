# 开发文档归档索引

## 1. 目的

本文件用于解决开发文档过多、口径混乱的问题。

从现在开始，直接驱动开发的文档只有：

1. `05_ai-coding/00-final-product-development-spec.md`
2. 当前阶段文档，例如 `05_ai-coding/02-phase-1-v1-product-closed-loop.md`
3. 具体任务 issue / prompt

其他文档只作为参考，不作为直接执行依据。

## 2. 当前有效文档

| 文件 | 用途 | 状态 |
|---|---|---|
| `05_ai-coding/00-final-product-development-spec.md` | 最终产品开发总纲 | 当前有效 |
| `05_ai-coding/02-phase-1-v1-product-closed-loop.md` | 当前开发阶段文档 | 当前有效 |
| `05_ai-coding/99-archive-index.md` | 归档说明 | 当前有效 |
| `04_prototype/product-v1/meal-agent-product-prototype.html` | 产品原型参考 | 参考，不能直接复制实现 |

## 3. 已备份文档

本次重构前，关键文档已备份到：

```text
05_ai-coding/backups/final-docs-restructure-20260512-112629/
```

备份内容：

| 备份文件 | 来源 | 说明 |
|---|---|---|
| `mvp-0.1-task-breakdown.md` | `05_ai-coding/` | 旧 MVP 0.1 任务拆解 |
| `frontend-tasks.md` | `05_ai-coding/` | 旧前端任务 |
| `backend-tasks.md` | `05_ai-coding/` | 旧后端任务 |
| `ai-service-tasks.md` | `05_ai-coding/` | 旧 AI 服务任务 |
| `test-cases.md` | `05_ai-coding/` | 旧测试用例 |
| `mvp-0.0-engineering-entry.md` | `05_ai-coding/` | 旧工程入场说明 |
| `ganfan-full-implementation-plan.from-claude-worktree.md` | `.claude/worktrees/modest-newton-309452/` | 全栈长期实施方案 |

## 4. 旧文档使用规则

### 可以参考

- 长期技术路线
- 数据模型灵感
- 原型交互细节
- 页面状态
- 验收口径
- 后续阶段的功能想法

### 不可直接执行

- 不直接迁移成 `apps/mobile` monorepo。
- 不直接按全栈方案引入 FastAPI、pgvector、SQLite、通知、Health Connect。
- 不直接开发 MVP 2.0-5.0。
- 不直接复制 HTML 原型 CSS 到 React Native 页面。
- 不绕过当前阶段文档新增页面、字段、组件。

## 5. 全栈长期方案定位

`ganfan-full-implementation-plan.md` 的定位调整为长期蓝图。

它可以用于：

- Phase 2 后端和 AI 服务设计参考
- Phase 3 个性化算法参考
- Phase 4 履约和社区路线参考

它不再用于：

- 当前 Phase 1 的直接任务拆解
- 当前工程目录重构
- 当前依赖选型
- 当前数据库立即落地

## 6. 原型定位

`04_prototype/product-v1/meal-agent-product-prototype.html` 是产品体验参考。

开发时应重点提取：

- 页面流转
- 首页状态
- 记录模式
- 分析状态
- 反馈状态
- 身体拼图状态
- 抽卡逻辑
- 关键数据字段

开发时不应直接继承：

- HTML DOM 结构
- CSS 写法
- localStorage 实现
- 原型中的 API key 配置方式
- 原型里未经过阶段裁剪的 2.0-5.0 功能

## 7. 后续新增文档规则

新增开发文档必须满足：

1. 明确属于哪个 Phase。
2. 明确是否是当前有效执行文档。
3. 不重复定义总纲已有架构。
4. 不把长期蓝图混进当前任务。
5. 每个任务必须有验收标准。

建议命名：

```text
05_ai-coding/03-phase-2-real-data-and-ai.md
05_ai-coding/04-phase-3-personalization-and-plan.md
05_ai-coding/05-phase-4-growth-and-fulfillment.md
```

