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
5. `docs/02-master-blueprint.md`
6. 当前阶段的 `docs/phases/phase-*.md`
7. 当前阶段的 `docs/acceptance/phase-*.md`
8. 当前任务文件或用户最新指令

阶段开发文档和验收文档必须从 `docs/02-master-blueprint.md` 拆解，不得脱离蓝图另起任务。

旧的 MVP 0.0 / MVP 0.1 / mock Phase 文档已移入 `_archive/`，只能作为历史参考。

## 当前阶段

当前处于基于总蓝图重新拆分阶段开发文档和验收文档后的开发准备阶段。

在用户明确确认前，不要继续扩展业务功能，不要迁移工程架构，不要新增原生依赖。

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

1. 阅读 `docs/00-INDEX.md`。
2. 阅读 `docs/01-ai-working-manual.md`。
3. 阅读 `docs/CURRENT_WORK.md` 和 `docs/TASK_LOG.md`。
4. 阅读 `docs/02-master-blueprint.md`。
5. 阅读当前阶段开发文档和验收文档。
6. 在 `docs/TASK_LOG.md` 新增“开始记录”：时间、Agent、阶段、Sprint、任务编号、目标、预计触碰范围。
7. 更新 `docs/CURRENT_WORK.md` 的当前任务指针。
8. 先看现有代码实现方式。
9. 以产品经理视角评估需求，给出最有用的功能和架构建议。
10. 与用户确认需求。
11. 得到用户明确修改代码的指令后再修改代码或文档。
12. 运行检查。
13. 打开当前阶段对应的 `docs/acceptance/phase-*.md`，逐条验收并标记 `PASS` / `PARTIAL` / `FAIL` / `N/A`。
14. 在 `docs/TASK_LOG.md` 补“结束记录”：时间、完成内容、变更文件、验收文档、逐条验收结果、验证命令、未能验证项目、遗留问题。
15. 更新 `docs/CURRENT_WORK.md` 的状态和下一步。
16. 提交变更说明。

## 任务追踪铁律

- 任何 Agent 开始开发前，必须先更新 `docs/TASK_LOG.md` 的开始记录。
- 任何 Agent 结束开发前，必须补齐 `docs/TASK_LOG.md` 的结束记录。
- 任何 Agent 结束任务前，必须读取当前阶段对应的 `docs/acceptance/phase-*.md`，逐条执行验收，并把结果写入 `docs/TASK_LOG.md` 的 END 记录。
- 验收结果必须使用 `PASS` / `PARTIAL` / `FAIL` / `N/A`。所有 `PARTIAL`、`FAIL`、`N/A` 都必须写明原因或未验证条件。
- 没有逐条验收记录的任务，不得标记为完成。
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
