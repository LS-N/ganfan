# 干饭

干饭是一款 AI 饮食决策 App，目标是帮助用户记录饮食、判断当天饮食状态，并给出下一餐可执行建议。

## 当前状态

当前仓库处于工作区治理和总纲对齐阶段。

唯一主路径：

```text
F:\ganfan
```

权威总纲：

```text
05_ai-coding/ganfan-full-implementation-plan.md
```

当前阶段入口：

```text
05_ai-coding/current-phase.md
```

## 开发入口

新 Agent 或开发者进入仓库后，按顺序阅读：

1. `05_ai-coding/current-phase.md`
2. `05_ai-coding/ganfan-full-implementation-plan.md`
3. `AGENTS.md`
4. 当前任务文件

不要以 `.claude/worktrees/*` 作为开发目录。那些目录是工具工作树，只可参考。

## 当前工程形态

短期工程仍在根目录：

```text
app/               Expo Router entry files
src/               App code: components, screens, services, stores, styles, types
```

总纲目标可能演进为：

```text
apps/mobile/
services/ai/
supabase/
```

是否迁移到完整 monorepo，需要单独确认后执行。

## Commands

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

## Project Map

```text
app/               Current Expo Router entry files
src/               Current app code
01_product/        Product north star and roadmap
02_architecture/   Architecture notes
03_prd/            PRDs
04_prototype/      Product prototypes and archived prototype snapshots
05_ai-coding/      Active AI development docs and total implementation plan
06_delivery/       Release and acceptance docs
docs/              Project status and engineering notes
```

## 注意

当前仓库存在未提交的 Phase 1/Phase 2 代码和旧文档改动。提交前必须按阶段拆分，不要 `git add .`。

