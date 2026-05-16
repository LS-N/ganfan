# AI 工作手册

## 工作原则

任何开发任务都必须先回到 `docs/02-master-blueprint.md`，再进入对应阶段开发文档和验收文档。不得绕过蓝图单独发明页面、字段、服务、任务或阶段。

## 阅读顺序

1. `docs/00-INDEX.md`
2. `docs/CURRENT_WORK.md`
3. `docs/TASK_LOG.md`
4. `docs/lessons/LESSONS_INDEX.md`
5. `docs/02-master-blueprint.md`
6. `docs/resources/RESOURCE_REGISTRY.md`
7. 当前阶段开发文档：`docs/phases/phase-*.md`
8. 当前阶段验收文档：`docs/acceptance/phase-*.md`
9. 默认原型：`docs/prototype/meal-agent-product-prototype.html`
10. 当前用户指令

## 任务分级

为避免流程过重，任务按风险分级执行：

- L0 只读评审 / 问答：只读相关文档和代码；不改文件时不新增 `TASK_LOG`，最终回复说明原因。
- L1 文档治理 / 原型小改：读取 `00-INDEX`、`CURRENT_WORK`、`TASK_LOG`、`LESSONS_INDEX` 和目标文件；不涉及真实资源时可不读完整资源索引；必须写 START / END。
- L2 App 业务代码 / 数据层：读取蓝图、阶段文档、验收文档和相关代码；按影响范围运行 lint/typecheck/test。
- L3 原生依赖 / 数据库 / AI provider / 真实联调 / 部署：必须读取资源索引、确认用户授权、记录真实资源验收口径；不得回显真实密钥。

并行流程治理任务不得覆盖当前产品任务指针。`docs/CURRENT_WORK.md` 应保留当前产品任务，治理任务写入“当前并行治理任务”或交接摘要。

## 开始和结束记录

任何 Agent 接手开发都必须留下可追溯记录。

### 开始前

在 `docs/TASK_LOG.md` 新增开始记录，至少包含：

- 开始时间（含时区）。
- Agent 名称，例如 Codex、Claude、人工。
- 阶段 / Sprint / 任务编号。
- 本次目标。
- 预计触碰范围。
- 是否需要用户批准的事项。

同步更新 `docs/CURRENT_WORK.md`：

- 当前阶段。
- 当前 Sprint。
- 当前任务编号。
- 当前状态。
- 阻塞项。
- 下一步。

### 结束前

先打开当前阶段对应的 `docs/acceptance/phase-*.md`，逐条执行验收。每一项必须标记为：

- `PASS`：已完成并已验证。
- `PARTIAL`：部分完成，必须写明缺口。
- `FAIL`：未完成或验证失败，必须写明原因。
- `N/A`：本次任务不适用，必须写明原因。

在 `docs/TASK_LOG.md` 补结束记录，至少包含：

- 结束时间（含时区）。
- 完成内容。
- 修改文件。
- 验收文档。
- 逐条验收结果。
- 本任务验收。
- 阶段验收影响范围。
- 验证命令和结果。
- 未能验证的项目。
- 需要人工/真机/外部服务验证的项目。
- Android/iOS 影响。
- 热更新影响。
- 是否需要重新打包。
- 本次问题-解决方案-经验教训。
- 经验索引编号，如本次新增或复用了 `docs/lessons/LESSONS_INDEX.md` 条目。
- 遗留问题和下一步建议。

如果没有逐条验收记录，当前任务不得标记为完成。

小任务的验收必须写清“本任务通过了什么”，以及“只影响哪些阶段验收项”。不得把原型小改、文档治理或局部修复写成整个阶段 `PASS`。

同步更新 `docs/CURRENT_WORK.md`，让下一个 Agent 能直接接手。

## 经验教训索引

`docs/TASK_LOG.md` 负责记录本次现场，`docs/lessons/LESSONS_INDEX.md` 负责沉淀可复用经验。两者必须互相引用。

后续 AI 遇到问题时必须先用关键词搜索经验索引，再对照条目的“适用范围”和“触发症状”。确认是同类问题后，才能复用“已验证解决方案”；如果症状不一致，只能作为排查参考，不得机械套用。

只有满足以下至少一项的问题才进入经验索引：

- 涉及真实联调、密钥、Supabase、EAS、真机、AI provider、数据库、构建或部署。
- 容易被多个 AI 重复踩坑。
- 已经有明确根因和已验证解决方案。
- 能沉淀为通用 SOP 或下一个项目可复用规则。
- 影响排查效率明显，预计复用后能节省大量时间。

不得进入经验索引的内容：

- 一次性拼写、格式、临时网络抖动。
- 没有验证过的猜测。
- 只适用于当前文件局部的小问题。
- 会泄露真实密钥、用户隐私或完整 raw response 的细节。

## 开发前确认

执行代码修改前必须完成：

- 读取现有代码实现方式。
- 更新 `docs/TASK_LOG.md` 开始记录。
- 更新 `docs/CURRENT_WORK.md` 当前任务指针。
- 判断任务属于哪个 MVP / Sprint / 任务编号。
- 明确是否需要原生依赖、数据库 migration、AI secret、FastAPI、Supabase 或部署配置。
- 若涉及真实联调、数据库 migration、AI provider、云资源、真机验收或数据导入，必须先读取 `docs/resources/RESOURCE_REGISTRY.md`，确认资源状态、真实值存放位置、验证方式和缺失降级策略。
- 若涉及新增原生依赖、迁移 monorepo、接真实 AI secret、创建 FastAPI 服务、创建 Supabase migrations，必须先得到用户明确批准。

## 资源与密钥规则

- 资源索引只记录资源名称、用途、变量名、存放位置、状态和验证方式。
- 禁止把真实密码、token、API key、service role key、数据库密码写入仓库文档、代码、日志或最终回复。
- 移动端 Expo 环境只能使用 `EXPO_PUBLIC_*` 公开变量；后端私密变量必须放在 `services/ai/.env`、本机环境、EAS secrets 或用户密码管理器。
- 真实值是否已配置，只能记录为“已配置/未配置/已验证/未验证”，不得回显真实值。
- 缺少真实资源时，验收结果必须标记 `PARTIAL` / `FAIL` / `N/A`，不得写 `PASS`。
- 任何真实资源状态发生变化后，必须同步更新 `docs/resources/RESOURCE_REGISTRY.md`；状态只能写 `PASS` / `PARTIAL` / `待验证` 等口径和验证条件，不得写真实值。

## 阶段文档使用规则

- 阶段开发文档只定义目标、范围、任务和交付物。
- 阶段验收文档只定义完成标准、检查命令、数据验收和风险。
- 阶段开发文档必须包含“本阶段必须引用的蓝图章节”，覆盖该阶段相关的 Schema、API、算法、Prompt、RLS、安全、UserContext、环境变量和 CI/CD 约束。
- Agent 执行阶段任务时，必须先读取该引用清单中的总蓝图片段，不得只看阶段任务表就开始开发。
- 当阶段文档与总蓝图冲突时，以 `docs/02-master-blueprint.md` 为准，并先修正文档，不直接写代码。
- `_archive/` 只能作为历史参考。

## 结束验收格式

`docs/TASK_LOG.md` 的 END 记录必须包含以下验收块：

```text
- 验收文档：
- 本任务验收：
- 验收结果：
  - PASS：
  - PARTIAL：
  - FAIL：
  - N/A：
- 阶段验收影响范围：
- 已运行命令：
- 未能验证的项目：
- 需要人工/真机/外部服务验证的项目：
- 本次问题-解决方案-经验教训：
  - 问题：
  - 解决方案：
  - 经验教训：
- 经验索引：
```

## 交付要求

每次完成任务后必须说明：

- 改了哪些文件。
- 为什么这样改。
- 如何运行。
- 如何测试。
- 是否影响 Android/iOS。
- 是否影响热更新。
- 是否需要重新打包。
- `docs/TASK_LOG.md` 和 `docs/CURRENT_WORK.md` 是否已更新。
- `docs/TASK_LOG.md` 是否已填写“本次问题-解决方案-经验教训”。
- 是否需要新增、更新或引用 `docs/lessons/LESSONS_INDEX.md`。

## 当前工程边界

当前正式工作区是 `F:\ganfan`。正式代码只在根目录 `app/` 和 `src/` 开发，除非用户批准迁移到蓝图中的 `apps/mobile/ + services/ai/ + supabase/` 结构。
