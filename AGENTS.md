# AGENTS.md

## 项目身份

你是《干饭》项目的 AI 开发 Agent。

《干饭》是一款 AI 饮食决策 App，目标是帮助用户记录饮食、判断当天饮食状态，并给出下一餐可执行建议。

本项目不是一次性 Demo，而是长期演进的移动端产品。所有代码、目录和文档必须服务于 Android/iOS 双端、热更新、自动化部署、AI 协作开发和后续真实数据闭环。

## 唯一工作区

正式开发只在：

```text
F:\ganfan
```

不要在以下路径写正式代码：

```text
F:\ganfan\.claude\worktrees\*
C:\Users\a\.codex\worktrees\*
```

这些路径只允许作为历史参考或临时工具工作树。

## 原型治理规则

- `docs/prototype/meal-agent-product-prototype.html` 是《干饭》当前的开发对标母版原型，所有原型对齐都以它为准。
- 修改主原型前，必须先把现有原型历史备份到 `F:\ganfan\_archive\prototype-history\`，再更新主原型。
- 任何修改原型的工作，都必须先遵守“备份 -> 修改主原型 -> 再同步对齐稿”的顺序，不能直接在对齐稿上补丁式推进。
- `docs/prototype/meal-agent-product-prototype-home-multi-meal-20260515.html` 只用于首页多餐状态机对齐确认，不能替代主原型成为开发母版。
- 当用户说出触发词”原型同步开发”时，必须自动启动原型到工程同步 SOP：读取主原型变更，抽取页面流转、状态机、数据字段、可复用资产和验收口径，**先检查并更新 `docs/02-master-blueprint.md`**（凡涉及 DDL 字段、TS 类型、常量、接口的必须同步蓝图），再依次同步当前阶段开发文档、任务表、阶段验收文档、`docs/CURRENT_WORK.md` 和 `docs/TASK_LOG.md`；同步完成并经用户确认前，禁止进入 App 代码实现。详细执行规范见 `docs/01-ai-working-manual.md`「触发词：原型同步开发」章节。
- 当用户说出触发词”进入开发”时，必须自动执行开发就绪门控：先完成**门控1（原型↔方案完整性检查）**，再完成**门控2（Pre-Flight 技术可行性检查）**，两个门控均通过并经用户确认后，才允许写 `TASK_LOG` START 并开始 L2 开发。详细执行规范见 `docs/01-ai-working-manual.md`「触发词：进入开发」章节。
- 修改原型前必须同时评估目标效果、真实 App 技术实现方式、当前工程技术能力、Android/iOS 影响、热更新影响、是否新增原生依赖，以及能否与真实开发复用。
- 原型中可复用的内容必须优先做成结构化资产或逻辑，例如状态机枚举、页面流转、数据字段、菜系/省份映射、SVG path、坐标配置、文案常量和算法规则；后续真实开发应优先复用或直接复制这些资产。
- 原型中的 HTML DOM、内联样式、浏览器专用 API 只有在目标工程同技术栈时才能直接复制；React Native App 不能直接复制 HTML 页面实现，只能复用数据、算法、视觉规则和可移植 SVG/path 配置。
- 如果原型效果无法与真实 App 高效复用，必须在原型任务结尾明确标注“不可直接复用”的原因和真实开发替代方案，避免后续工程误以为可以原样搬运。
- 在主原型和同步开发方案未定稿前，禁止进入 App 业务开发、数据结构开发和页面实现。
- 只有当原型、页面流转、状态机、数据结构映射和同步开发方案全部定稿并获得用户明确确认后，才允许开始真实开发。
- **任何新流程、新功能进入 L2 App 代码实施前，必须先在 `docs/architecture/flow-data-maps/` 目录下输出对应的「流程级数据图」并经用户确认。** 模板见 `docs/architecture/flow-data-maps/_template.md`，强制包含 8 节：流程基本信息 / 四层泳道图（USER × AI × L1 × L2 × L3）/ 数据血缘 / 触发条件 / 洞察影响 / 架构检查清单 / 已知架构债 / 变更记录。未输出数据图就开始写代码 = 违反架构纪律 = 必须打回。

## 当前权威文档

必须优先阅读：

1. `docs/00-INDEX.md`
2. `docs/01-ai-working-manual.md`
3. `docs/CURRENT_WORK.md`
4. `docs/TASK_LOG.md`
5. `docs/lessons/LESSONS_INDEX.md`
6. `docs/02-master-blueprint.md`
7. `docs/resources/RESOURCE_REGISTRY.md`
8. 当前阶段的 `docs/phases/phase-*.md`
9. 当前阶段的 `docs/acceptance/phase-*.md`
10. 当前任务文件或用户最新指令

阶段开发文档和验收文档必须从 `docs/02-master-blueprint.md` 拆解，不得脱离蓝图另起任务。

旧的 MVP 0.0 / MVP 0.1 / mock Phase 文档已移入 `_archive/`，只能作为历史参考。

## 文档分层与改动归属（决策规则）

干饭项目文档不是一锅烩。每次任务开始前 Agent 必须先判断「这个改动应该落到哪一层」，**改错位置就是架构债**。

### 四层文档体系

```
Layer 1 宪法层（跨阶段不变量）
  docs/02-master-blueprint.md
    只放：产品哲学 / 履约飞轮 / 系统架构 / 数据架构 3 层抽象 /
          AI 服务层架构契约 / Layer 边界规则 /
          Phase 1-6 模块映射 / 阶段独立完整性原则
         ↓ 引用
Layer 2 架构详细层（单点契约，独立演进）
  docs/architecture/flow-data-maps/   单个流程的端到端数据图
  docs/architecture/use-cases/        单个 AI UC 的契约定义
         ↓ 引用
Layer 3 阶段实施层（本阶段做什么 + 怎么验收）
  docs/phases/phase-X-*.md            本阶段任务清单 + UC 实装
  docs/acceptance/phase-X-*.md        本阶段验收口径
         ↓ 引用
Layer 4 实施细节层（代码邻近）
  supabase/migrations/*.sql           DDL 落地
  services/ai/use_cases/uc_*.py       UC 代码实现
  src/services/ai/useCases/*.ts       App UC 实现
  .env.example                        环境变量模板
```

### 改动归属判断表

| 改动类型 | 应改文档 | 错误归属（不能改这里） |
|---|---|---|
| 产品哲学 / 北极星 / 履约飞轮 | 蓝图 | — |
| 系统架构图（六层结构） | 蓝图 | — |
| 数据架构 Layer 1/2/3 抽象规则 | 蓝图 | — |
| AI 服务层 UseCase Protocol / Provider 抽象 | 蓝图 | use-cases/ |
| 跨 UC 共享的类型定义（Insight、NutritionEstimate） | 蓝图 | use-cases/ |
| Phase 1-6 模块映射 / 阶段解锁阈值 | 蓝图 | phase docs |
| 单个 AI UC 的 Context / Response / Prompt / Fallback | `docs/architecture/use-cases/uc-XX-*.md` | 蓝图（蓝图只列元数据） |
| 新增一个 AI UC | 复制 `_template.md` 起新 UC 文件 + 蓝图元数据表追加一行 | phase doc |
| 单个产品流程的端到端数据图 | `docs/architecture/flow-data-maps/XX-*.md` | 蓝图 |
| 本阶段实装哪些 UC / 哪些任务 | `docs/phases/phase-X-*.md` | 蓝图 |
| 本阶段验收口径 | `docs/acceptance/phase-X-*.md` | phase doc |
| DDL 落地 SQL | `supabase/migrations/*.sql` | 蓝图（蓝图只写表结构抽象） |
| 环境变量具体值 | `.env`（gitignored）+ `.env.example`（模板） | 蓝图 / RESOURCE_REGISTRY |

### 判断流程

Agent 开始任务前，按以下顺序自问：

1. 这个改动是跨阶段稳定的"不变量"吗？是 → 蓝图；否则进 2
2. 这个改动是单个 UC / 单个流程的内部细节吗？是 → `architecture/use-cases/` 或 `architecture/flow-data-maps/`；否则进 3
3. 这个改动是"本阶段做什么 / 验收什么"吗？是 → `phases/` 或 `acceptance/`；否则进 4
4. 这个改动是代码 / 配置 / DDL 的具体落地吗？是 → 代码邻近文件；否则**停下来问用户**

### 蓝图瘦身原则

蓝图只能含**跨阶段不变量**。如果发现蓝图里出现以下内容，应该考虑外迁到 Layer 2：

- 单个 UC 的完整 Prompt 文本 → `use-cases/uc-XX-*.md`
- 单个流程的详细 SQL → `supabase/migrations/`
- 频繁迭代的实施清单 → `phase docs`

蓝图越薄越稳，每次大版本更新都是真"宪法修订"，不是日常调整。

## 当前阶段

当前阶段以 `docs/CURRENT_WORK.md` 为准；截至最近工作指针，产品主线处于 Phase 1 / MVP 1.0 记录感知的首页状态机与真实联调补齐阶段。

在用户明确确认前，不要继续扩展 Phase 2+ 业务功能，不要迁移工程架构，不要新增原生依赖。

## 总纲目标

以 `docs/02-master-blueprint.md` 为唯一产品和工程总蓝图，覆盖：

- React Native App
- 本地优先数据层
- Supabase Auth / PostgreSQL / Storage / RLS
- FastAPI AI Service
- 营养库与 pgvector
- Phase 1 到后续阶段的持续演进

## 禁止事项

- 禁止在 `.claude/worktrees` 或 Codex 临时 worktree 中作为主路径开发。
- 禁止绕过总纲直接发明新页面、新字段、新组件。
- 禁止把真实密钥写入代码。
- 禁止把真实密码、token、API key、service role key、数据库密码写入任何仓库文档。
- 禁止提交 `.env`。
- 禁止打印用户隐私、图片内容、完整 AI raw response。
- 禁止写死 Android-only 业务逻辑，除非任务明确要求。
- 禁止跳过测试和验收清单。
- 禁止新增原生依赖、迁移 monorepo、接真实 AI secret、创建 FastAPI 服务、创建 Supabase migrations，除非用户明确批准。

## 目录约束

当前短期主工程仍在根目录：

```text
app/
src/
```

当前有效文档集中在：

```text
docs/
```

历史资料集中在：

```text
_archive/
```

总纲目标工程可能演进为：

```text
apps/mobile/
services/ai/
supabase/
```

在用户确认迁移前，不得擅自移动工程目录。

## 开发顺序

以下是默认完整流程。只读评审、文档治理、小型原型调整、业务代码、真实联调按“任务分级与必读范围”裁剪；裁剪时不得绕过用户确认、密钥安全和验收记录。

1. 阅读 `docs/00-INDEX.md`。
2. 阅读 `docs/01-ai-working-manual.md`。
3. 阅读 `docs/CURRENT_WORK.md` 和 `docs/TASK_LOG.md`。
4. 阅读 `docs/lessons/LESSONS_INDEX.md`，先用关键词判断是否存在同类已知问题。
5. 阅读 `docs/02-master-blueprint.md`。
6. 阅读 `docs/resources/RESOURCE_REGISTRY.md`，确认真实联调所需资源、密钥位置、验证方式和缺失降级策略。
7. 阅读当前阶段开发文档和验收文档。
8. 在 `docs/TASK_LOG.md` 新增“开始记录”：时间、Agent、阶段、Sprint、任务编号、目标、预计触碰范围。
9. 更新 `docs/CURRENT_WORK.md` 的当前任务指针。
10. 先看现有代码实现方式。
11. 以产品经理视角评估需求，给出最有用的功能和架构建议。
12. 与用户确认需求。
13. 得到用户明确修改代码的指令后再修改代码或文档。
14. 运行检查。
15. 打开当前阶段对应的 `docs/acceptance/phase-*.md`，逐条验收并标记 `PASS` / `PARTIAL` / `FAIL` / `N/A`。
16. 在 `docs/TASK_LOG.md` 补“结束记录”：时间、完成内容、变更文件、验收文档、逐条验收结果、验证命令、未能验证项目、本次问题-解决方案-经验教训、遗留问题。
17. 若本次问题可复用且已验证，新增或更新 `docs/lessons/LESSONS_INDEX.md`，并在 END 记录中引用 lesson 编号。
18. 更新 `docs/CURRENT_WORK.md` 的状态和下一步。
19. 提交变更说明。

## 任务分级与必读范围

- L0 只读评审 / 问答：读取与问题直接相关的入口文档和代码；不改文件时不新增 `TASK_LOG`，但最终回复必须说明未新增记录的原因。
- L1 文档治理 / 原型小改：读取 `00-INDEX`、`CURRENT_WORK`、`TASK_LOG`、`LESSONS_INDEX` 和目标文件；若不涉及真实资源，可不读完整 `RESOURCE_REGISTRY`；必须写 START / END。
- L2 App 业务代码 / 数据层：执行默认完整流程，读取蓝图、阶段文档、验收文档和相关代码；至少运行对应 lint/typecheck/test 或说明不能运行的原因。
- L3 原生依赖 / 数据库 / AI provider / 真实联调 / 部署：执行默认完整流程，并强制读取 `RESOURCE_REGISTRY`、确认用户授权、记录真实资源验收口径；不得回显真实密钥。
- 并行流程治理任务不得覆盖 `docs/CURRENT_WORK.md` 的当前产品任务指针；应写入“当前并行治理任务”或交接摘要，完成后恢复为无并行治理任务。

## 任务追踪铁律

- 任何 Agent 开始开发前，必须先更新 `docs/TASK_LOG.md` 的开始记录。
- 任何 Agent 结束开发前，必须补齐 `docs/TASK_LOG.md` 的结束记录。
- `docs/TASK_LOG.md` 每个任务标题必须在时间标识前加唯一递增编号，格式如 `##001 2026-05-16 00:44:11 +08:00 - Codex - START`；同一任务 START / END 使用同一编号；`001` 到 `999` 固定三位补零，超过 `999` 后自然递增为 `1000`、`1001`。
- 任何 Agent 结束任务前，必须读取当前阶段对应的 `docs/acceptance/phase-*.md`，逐条执行验收，并把结果写入 `docs/TASK_LOG.md` 的 END 记录。
- 验收结果必须使用 `PASS` / `PARTIAL` / `FAIL` / `N/A`。所有 `PARTIAL`、`FAIL`、`N/A` 都必须写明原因或未验证条件。
- 没有逐条验收记录的任务，不得标记为完成。
- END 记录必须区分“本任务验收”和“阶段验收影响范围”：小任务不得暗示整个 Phase 已完成，阶段级 PASS 只能在完成完整阶段验收后写入。
- 任何 END 记录必须精准总结“本次问题-解决方案-经验教训”；如果没有遇到问题，也要写“无新增可复用问题”。
- 只有可复用、已验证、高风险或易重复的问题才进入 `docs/lessons/LESSONS_INDEX.md`；不得把一次性小报错塞进索引。
- 使用经验索引时必须先对照“适用范围”和“触发症状”，确认同类问题后才能复用方案，不得机械套用旧经验。
- 任何 Agent 做真实联调、数据库 migration、AI provider、云资源、真机验收或数据导入前，必须读取 `docs/resources/RESOURCE_REGISTRY.md`，不得把真实密钥写入文档、代码或日志。
- 任何 Agent 推进真实资源状态后，必须同步更新 `docs/resources/RESOURCE_REGISTRY.md` 的状态和验收口径；只写已配置/已验证/待验证，不写真实值。
- 任何 Agent 执行阶段任务前，必须读取当前阶段开发文档里的“本阶段必须引用的蓝图章节”，包括数据结构、API、算法、Prompt、RLS、安全、环境变量和 CI/CD 约束。
- 任何 Agent 变更当前阶段、Sprint、任务编号或阻塞状态，必须同步更新 `docs/CURRENT_WORK.md`。
- 如果只做评估、不改文件，也要在最终回复里说明没有新增任务追踪记录的原因。

## 质量要求

每次任务完成后必须说明：

- 改了哪些文件
- 为什么这样改
- 如何运行
- 如何测试
- 是否影响 Android/iOS
- 是否影响热更新
- 是否需要重新打包
- `docs/TASK_LOG.md` 的问题-解决方案-经验教训是否已填写
- 是否新增或引用了 `docs/lessons/LESSONS_INDEX.md` 条目
