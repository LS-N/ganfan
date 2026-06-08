# 干饭工程架构地图

> 本文件是整个干饭工程架构的导航入口。任何 AI 或工程师接手时，先读这份地图，按需进入子文档；不要再用「读 4000 行蓝图找架构」的方式工作。
>
> **本地图 ≠ 蓝图**：蓝图（`docs/02-master-blueprint.md`）只承载「产品视角」——做什么、为谁做、为什么这么做。**所有「怎么实现」的架构细节都在 `docs/architecture/` 下**。

---

## 一、文档分层（必读）

```
┌─────────────────────────────────────────────────────────────┐
│  产品蓝图：docs/02-master-blueprint.md                       │
│  - 产品最高原则、用户分层、形态战略、履约飞轮                │
│  - 阶段独立完整性、模块独立 + 横切层架构                     │
│  - 6 个 Phase 范围声明 + 业务规则（解锁阈值、抽卡规范等）    │
│  → 回答"做什么 / 为谁做 / 为什么"                           │
└────────────────────────────┬────────────────────────────────┘
                             ↓ 引用
┌─────────────────────────────────────────────────────────────┐
│  架构子文档：docs/architecture/*.md                          │
│  - 数据架构 / 接口架构 / 模型架构 / 观测架构                 │
│  - UI 系统 / 类型架构 / 安全架构 / 工程架构 / Agent 架构    │
│  → 回答"怎么实现"                                           │
└────────────────────────────┬────────────────────────────────┘
                             ↓ 引用
┌─────────────────────────────────────────────────────────────┐
│  实施文档：docs/phases/ + docs/acceptance/                   │
│  - 阶段开发任务表、验收清单                                  │
│  → 回答"现在做什么 / 怎么验收"                              │
└─────────────────────────────────────────────────────────────┘
```

**冲突处理**：蓝图 > 架构子文档 > 实施文档。架构子文档与蓝图冲突时必须先修正子文档；实施文档与上层冲突时必须先停止开发再对齐。

---

## 二、九个架构子文档（地图）

| 文档 | 管什么 | 状态 | 关联蓝图章节 |
|---|---|---|---|
| `architecture/README.md`（本文件） | 架构地图导航 | ✅ 当前文档 | — |
| `architecture/data-architecture.md` | 三层数据架构（Layer 1 数据源 / Layer 2 洞察引擎 / Layer 3 消费层）+ 完整 Schema + 履约智能横向契约 + AI 数据复利飞轮 | ✅ 已落地（##045） | 「产品数据架构」（已迁出） |
| `architecture/api-architecture.md` | 内部 API（Mobile ↔ FastAPI ↔ Supabase）+ MCP Server 对外能力边界 + capability 清单 + OAuth scope + 内外能力同源原则 | ✅ 已落地（##045） | 「API 接口规范」（已迁出）+「产品形态战略」 |
| `architecture/model-architecture.md` | AI 服务层架构 + Provider 抽象 + Prompt 版本化 + 评估机制 + 降级策略 + UserContext / TaskContext composer + Claude Prompt 模板 | ✅ 已落地（##045） | 「AI 服务层架构」「算法与大模型分工」「Prompt 模板」（已迁出） |
| `architecture/observability.md` | AI 调用成本上限 + 熔断 + 错误报警 + 用户行为埋点（含 F1 用户分层三指标）+ 盈亏监测接入 | ✅ 已落地（##045） | 新增 |
| `architecture/ui-system.md` | 色彩 / 字体 / 间距 / 圆角 token + 基础组件清单 + 复合组件规范 | ✅ 已落地（##045） | 「UI 设计系统」（已迁出） |
| `architecture/type-architecture.md` | 核心 TypeScript 类型契约（Meal / Profile / DrawCard 等）+ Zustand Store 接口 + 类型同步规则 | ✅ 已落地（##045） | 「核心 TypeScript 类型」「Zustand Store 接口定义」（已迁出） |
| `architecture/security-architecture.md` | Supabase Auth + 完整 RLS 策略 + FastAPI 安全规范（速率限制 / CORS / JWT）+ 密钥管理 + MCP 隐私边界 | ✅ 已落地（##045） | 「完整 RLS 策略」「FastAPI 安全规范」（已迁出） |
| `architecture/engineering-architecture.md` | 系统架构图 + 技术栈 + 仓库结构（当前过渡态 → 目标态迁移条件）+ CI/CD + 开发规范 + 环境变量 | ✅ 已落地（##045） | 「总体架构设计」「仓库结构」「CI/CD 流水线」「开发规范」（已迁出） |
| `architecture/agent-architecture.md` | Layer A 对外能力层 / Layer B 用户面 Agent / Layer C 后端 Agent 群 + Orchestrator-Worker 模式 + Agent 渐进路径 + 业界教训（禁止 peer collab / cost monitoring from day one） | ✅ 已落地（##045） | 「产品形态战略」（延展） |
| `architecture/flow-data-maps/` | 流程级数据图（每个用户流程一份，含四层泳道 + 数据血缘 + 架构检查） | ✅ 已有 | 蓝图强制要求 |
| `architecture/use-cases/` | 用例级架构图（按 AI 用例组织：餐次分析 / 身体洞察 / 抽卡推荐 / 剩余对比 / 营养匹配） | ✅ 已有 | — |

---

## 三、按问题找文档（快速索引）

### 我要改数据/Schema/数据库
→ `data-architecture.md` + `security-architecture.md`（RLS）

### 我要加新接口/路由
→ `api-architecture.md` + `security-architecture.md`（速率限制 + Auth）

### 我要改 AI Prompt 或换模型 provider
→ `model-architecture.md`

### 我要查 AI 调用花了多少钱 / 报警
→ `observability.md`

### 我要加新 UI 组件 / 改设计 token
→ `ui-system.md`

### 我要改 TypeScript 类型 / Store
→ `type-architecture.md`

### 我要改部署 / CI / 环境变量
→ `engineering-architecture.md`

### 我要让产品被 Siri/ChatGPT 调用
→ `api-architecture.md`（MCP Server 节）+ `security-architecture.md`（OAuth scope）

### 我要做 Multi-agent 开发
→ `agent-architecture.md`

### 我要看一个用户流程的完整数据流
→ `flow-data-maps/`（按流程编号）

### 我要看一个 AI 用例的实现架构
→ `use-cases/`（按 UC 编号）

---

## 四、新增架构文档的规则

任何想新增 `architecture/*.md` 的人必须先回答：

1. **不能并入已有专题吗？** 优先扩展已有文档而非新增。
2. **是「怎么实现」类的吗？** 「为什么这么做」类内容属于蓝图，不属于架构子文档。
3. **跨多个专题吗？** 跨专题的产物应放 `flow-data-maps/` 或 `use-cases/`，不创建新专题。

满足以上 3 条才允许新增。新增后必须立刻：
- 在本文件「二、九个架构子文档」表中追加一行
- 在「三、按问题找文档」中追加一条查询路径
- 在 `docs/00-INDEX.md` 中追加导航

---

## 五、文档统一规范

所有 `architecture/*.md` 必须包含以下 6 节（结构对齐才能交叉引用）：

1. **定位与边界** — 本文档管什么、不管什么、与哪些文档交接
2. **核心原则** — 不可破坏的架构红线（5-8 条，每条有「为什么」）
3. **架构内容** — 主体（图、表、规范、代码骨架）
4. **Phase 演进** — 当前 Phase 实现到哪一层、未来 Phase 怎么扩展
5. **禁止事项** — 容易踩的坑（来自 LESSONS 或业界教训）
6. **变更记录** — 时间 + 任务编号 + 变更摘要

---

## 六、本地图变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘。建立架构地图 + 9 个专题文档框架，蓝图开始瘦身 |
