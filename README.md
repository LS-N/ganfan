# 干饭

《干饭》是一款 AI 饮食决策 App，目标是帮助用户记录饮食、判断当天饮食状态，并给出下一餐可执行建议。

## 当前状态

当前仓库已完成入口文档和工作区重组：

- 唯一正式工作区：`F:\ganfan`
- 当前工程形态：根目录 Expo App（`app/` + `src/`）
- 当前阶段：Phase 1 产品闭环与 Phase 2 真实数据/AI 服务准备
- 当前文档入口：[docs/00-INDEX.md](docs/00-INDEX.md)
- AI Agent 契约：[AGENTS.md](AGENTS.md)

## 新人和 Agent 入口

进入仓库后按顺序阅读：

1. [docs/00-INDEX.md](docs/00-INDEX.md)
2. [docs/01-current-phase.md](docs/01-current-phase.md)
3. [AGENTS.md](AGENTS.md)
4. 当前任务文件或用户最新指令

旧 MVP 0.0 / MVP 0.1 文档、旧 prompt、原型历史备份已统一放入 `_archive/`。除非用户要求考古，不要把 `_archive/` 内容当作当前执行口径。

## 项目结构

```text
app/                 Expo Router 路由入口
src/                 App 源码：components / screens / services / stores / styles / types
docs/                当前有效文档、产品说明、原型入口、验收材料
_archive/            历史文档与旧原型备份，只供参考
.github/workflows/   CI / EAS 工作流
```

暂不迁移到 `apps/mobile/ + services/ai/ + supabase/`。如需迁移，必须单独确认。

## 常用命令

```powershell
npm install
npm run lint
npm run typecheck
npm test
npm run web
```

Preview OTA update:

```powershell
npm run eas:update:preview
```

## 注意

- 不要在 `F:\ganfan\.claude\worktrees\*` 或 `C:\Users\a\.codex\worktrees\*` 开发正式代码。
- 不要提交 `.env` 或真实密钥。
- 不要跳过测试和验收清单。
- 新增原生依赖、迁移 monorepo、接真实 AI secret、创建 FastAPI 服务或 Supabase migrations 前必须得到明确批准。
