# START HERE

## 先读这个

当前仓库已经不再以旧的 MVP 0.0 工程入场包作为唯一执行口径。

正式开发入口是：

```text
05_ai-coding/current-phase.md
05_ai-coding/ganfan-full-implementation-plan.md
AGENTS.md
```

## 唯一工作区

所有正式开发、运行、测试、提交都在：

```powershell
cd F:\ganfan
```

不要把以下路径当作项目根目录：

```text
F:\ganfan\.claude\worktrees\*
C:\Users\a\.codex\worktrees\*
```

## 当前状态

当前处于工作区治理和总纲对齐阶段。

目的：

- 统一 `F:\ganfan` 为唯一主路径。
- 将真实总纲放回主路径。
- 清理旧入口文档造成的阶段歧义。
- 在继续开发前，明确是否迁移到完整总纲工程架构。

## 当前不做

在用户确认前，不要执行：

- 迁移到 `apps/mobile` monorepo。
- 新增原生依赖。
- 接真实 AI secret。
- 创建 FastAPI 服务。
- 创建 Supabase migrations。
- 删除旧文档或大规模移动文件。

## 常用命令

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run web
```

