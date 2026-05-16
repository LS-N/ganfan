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
