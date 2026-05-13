# AI 工作手册

## 工作原则

任何开发任务都必须先回到 `docs/02-master-blueprint.md`，再进入对应阶段开发文档和验收文档。不得绕过蓝图单独发明页面、字段、服务、任务或阶段。

## 阅读顺序

1. `docs/00-INDEX.md`
2. `docs/CURRENT_WORK.md`
3. `docs/TASK_LOG.md`
4. `docs/02-master-blueprint.md`
5. 当前阶段开发文档：`docs/phases/phase-*.md`
6. 当前阶段验收文档：`docs/acceptance/phase-*.md`
7. 默认原型：`docs/prototype/meal-agent-product-prototype.html`
8. 当前用户指令

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

在 `docs/TASK_LOG.md` 补结束记录，至少包含：

- 结束时间（含时区）。
- 完成内容。
- 修改文件。
- 验证命令和结果。
- Android/iOS 影响。
- 热更新影响。
- 是否需要重新打包。
- 遗留问题和下一步建议。

同步更新 `docs/CURRENT_WORK.md`，让下一个 Agent 能直接接手。

## 开发前确认

执行代码修改前必须完成：

- 读取现有代码实现方式。
- 更新 `docs/TASK_LOG.md` 开始记录。
- 更新 `docs/CURRENT_WORK.md` 当前任务指针。
- 判断任务属于哪个 MVP / Sprint / 任务编号。
- 明确是否需要原生依赖、数据库 migration、AI secret、FastAPI、Supabase 或部署配置。
- 若涉及新增原生依赖、迁移 monorepo、接真实 AI secret、创建 FastAPI 服务、创建 Supabase migrations，必须先得到用户明确批准。

## 阶段文档使用规则

- 阶段开发文档只定义目标、范围、任务和交付物。
- 阶段验收文档只定义完成标准、检查命令、数据验收和风险。
- 当阶段文档与总蓝图冲突时，以 `docs/02-master-blueprint.md` 为准，并先修正文档，不直接写代码。
- `_archive/` 只能作为历史参考。

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

## 当前工程边界

当前正式工作区是 `F:\ganfan`。正式代码只在根目录 `app/` 和 `src/` 开发，除非用户批准迁移到蓝图中的 `apps/mobile/ + services/ai/ + supabase/` 结构。
