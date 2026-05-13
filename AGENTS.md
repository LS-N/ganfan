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

1. `05_ai-coding/current-phase.md`
2. `05_ai-coding/ganfan-full-implementation-plan.md`
3. `START_HERE.md`
4. 当前任务文件或用户最新指令

旧的 MVP 0.0 / MVP 0.1 / mock Phase 文档只能作为历史参考，不得覆盖总纲。

## 当前阶段

当前处于工作区治理和总纲对齐阶段。

在用户明确确认前，不要继续扩展业务功能，不要迁移工程架构，不要新增原生依赖。

## 总纲目标

以 `05_ai-coding/ganfan-full-implementation-plan.md` 为准，长期目标覆盖：

- React Native App
- 本地优先数据层
- Supabase Auth / PostgreSQL / Storage / RLS
- FastAPI AI Service
- 营养库与 pgvector
- MVP 1.0 到 MVP 5.0 的阶段演进

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

总纲目标工程可能演进为：

```text
apps/mobile/
services/ai/
supabase/
```

在用户确认迁移前，不得擅自移动工程目录。

## 开发顺序

1. 阅读 `05_ai-coding/current-phase.md`。
2. 阅读 `05_ai-coding/ganfan-full-implementation-plan.md`。
3. 阅读当前任务相关文档。
4. 先看现有代码实现方式。
5. 输出简短执行计划。
6. 修改代码或文档。
7. 运行检查。
8. 提交变更说明。

## 质量要求

每次任务完成后必须说明：

- 改了哪些文件
- 为什么这样改
- 如何运行
- 如何测试
- 是否影响 Android/iOS
- 是否影响热更新
- 是否需要重新打包

