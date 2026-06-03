# AI Use Cases 目录

本目录存放干饭产品所有 AI 调用点的**详细契约定义**。每个 UC 一个文件，独立版本、独立演进、互不污染。

## 上下游关系

```
docs/02-master-blueprint.md
  └── 「AI 服务层架构」章节
       └── 定义 UseCase Protocol、Provider 抽象、Registry 模式（架构契约）
              ↓ 引用
       └── 本目录每个 uc-XX-*.md
              ↓ 实施依据
       └── services/ai/use_cases/uc_XX_*.py  (FastAPI 实现)
       └── src/services/ai/useCases/xxx.ts    (App 实现)
```

**蓝图定义"AI 服务层有什么样的契约结构"**，本目录定义"每个 UC 的具体契约内容"。

## 当前 UC 索引

| ID | 文件 | name | Layer | Phase | 状态 |
|---|---|---|---|---|---|
| UC-01 | [uc-01-meal-analysis.md](./uc-01-meal-analysis.md) | meal_analysis | producer+consumer | 1 | DRAFT |
| UC-02 | [uc-02-body-insight.md](./uc-02-body-insight.md) | body_insight | consumer | 1 | DRAFT |
| UC-03 | [uc-03-card-recommend.md](./uc-03-card-recommend.md) | card_recommend | consumer | 2 | DRAFT |
| UC-04 | [uc-04-leftover-compare.md](./uc-04-leftover-compare.md) | leftover_compare | producer | 1/2 可选 | DRAFT |
| UC-05 | [uc-05-nutrition-match.md](./uc-05-nutrition-match.md) | nutrition_match | enricher | 1 | DRAFT |

## 何时需要改本目录的文件

| 变更类型 | 改这里 | 不改这里（改别处） |
|---|---|---|
| Prompt 文本调整 | ✅ uc-XX 文件的 §5 | — |
| UC Context Schema 字段增减 | ✅ uc-XX 文件的 §3 | 同步改 phase doc 任务清单 |
| UC Response Schema 字段增减 | ✅ uc-XX 文件的 §4 | 同步改 App 端 Zod schema |
| UC Fallback 策略调整 | ✅ uc-XX 文件的 §7 | — |
| 新增一个 UC | ✅ 复制 `_template.md` 起新文件 + 在本 README 索引追加一行 | 同步在蓝图「AI 服务层架构」章节的"UC 注册表"加一行（仅元数据） |
| UseCase Protocol 字段增减 | ❌ 不在这里 | 改蓝图 |
| Provider 抽象层改动 | ❌ 不在这里 | 改蓝图 |
| Layer 归属规则改动（producer/consumer 定义） | ❌ 不在这里 | 改蓝图 |
| 本阶段实装哪些 UC | ❌ 不在这里 | 改 `docs/phases/phase-X-*.md` |

## 新增 UC 的标准流程

任何新增 AI 调用点必须按以下步骤进行：

```
1. 在本 README 索引追加一行（UC-NN，name，Layer，Phase，DRAFT）
   ↓
2. 复制 _template.md 为 uc-NN-name.md
   ↓
3. 填写完整契约：元数据 / Context Schema / Response Schema /
                   Prompt / Provider / Fallback / 依赖 / Phase 演进 / 评估样本
   ↓
4. 在蓝图「AI 服务层架构」章节的"UC 注册表"表格追加一行（仅元数据）
   ↓
5. 在对应 Phase 文档新增任务编号，引用本 UC 文件
   ↓
6. 用户确认 → 状态从 DRAFT 改为 ACTIVE
   ↓
7. 进入"进入开发"门控，再开始写代码
```

**禁止跳过本流程直接实施 AI 调用代码。** 任何绕过本流程的 AI 调用都是架构债。

## UC 版本管理规则

每个 UC 维护两个版本号：

| 版本号 | 含义 | 升级触发 | 兼容性影响 |
|---|---|---|---|
| `version` | UC 整体契约版本 | Context / Response Schema 变化 | 可能破坏兼容 |
| `prompt_version` | Prompt 文本版本 | 仅 Prompt 文本调整 | 完全兼容 |

**升级路径：**
- `v1.0 → v1.1`：Prompt 微调（绿区，单文件改动）
- `v1.0 → v2.0`：Context 加 optional 字段（黄区，向后兼容）
- `v1.0 → v3.0`：Response 字段重命名或类型改变（红区，App + FastAPI 同步升级）

## 跨 UC 共享类型

以下类型在多个 UC 中复用，**定义放在蓝图，不在单个 UC 文件中重复**：

| 类型 | 定义位置 | 用途 |
|---|---|---|
| `Insight` | 蓝图「Layer 2 洞察引擎」章节 | UC-01 / UC-02 / UC-03 都消费 |
| `RecentMealRef` | 蓝图「核心 TypeScript 类型」章节 | UC-01 / UC-03 都消费 |
| `NutritionEstimate` | 蓝图「核心 TypeScript 类型」章节 | UC-01 / UC-04 / UC-05 都涉及 |
| `RecommendationStage` 枚举 | 蓝图「饭前抽卡功能规范」章节 | UC-01 / UC-03 都用作 advice_stage |

各 UC 文件**引用**这些类型，不重复定义。

## 与 flow-data-maps 的关系

| 目录 | 范围 | 视角 |
|---|---|---|
| `docs/architecture/flow-data-maps/` | 单个产品流程（如「新用户 onboarding」） | 跨层 + 跨模块 + 跨 AI/算法 的端到端流程 |
| `docs/architecture/use-cases/` | 单个 AI 调用点 | 只看 AI 服务层这一个调用点的契约 |

一个流程可能涉及多个 UC（例如"餐前拍照"流程涉及 UC-01 + UC-05），flow-data-map 是跨视角串联，use-case 是单点契约。
