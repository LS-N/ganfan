# 未提交变更分组提交清单

> 基于 `_git_status.txt` 和 `_git_diff_stat.txt` 自动整理。
> 当前分支 `codex/V0.1`，HEAD `ca3abb6e`，本清单按 4 组依次 commit。
> 全程在 `F:\ganfan` 根目录、PowerShell 下执行。

---

## 准备：先确认状态干净

```powershell
cd F:\ganfan
git status --short
```

应该看到大约 35 个 `M` + 50 多个 `??`。如果有意外条目（比如 `_git_status.txt` 之类临时文件），先处理掉：

```powershell
del _git_status.txt
del _git_diff_stat.txt
```

---

## 组 1：工作区治理 + 当前总纲（最先提交）

新建的当前权威文档 + 入口文档修改 + 治理决策日志 + 重组方案。
提交后任何新 Agent 都能从这些文件读到当前阶段。

```powershell
git add `
  AGENTS.md `
  README.md `
  START_HERE.md `
  REORG_PLAN.md `
  .gitignore `
  05_ai-coding/00-final-product-development-spec.md `
  05_ai-coding/02-phase-1-v1-product-closed-loop.md `
  05_ai-coding/03-phase-2-real-data-and-ai.md `
  05_ai-coding/99-archive-index.md `
  05_ai-coding/current-phase.md `
  05_ai-coding/ganfan-full-implementation-plan.md `
  05_ai-coding/phase-2-autonomous-execution-prompt.md `
  05_ai-coding/backups/ `
  docs/PROJECT_STATUS.md `
  docs/DEVELOPMENT_LOG.md

git commit -m "docs: workspace governance, phase 1/2 spec alignment, archive index, reorg plan"
```

---

## 组 2：旧 MVP 0.0/0.1 文档同步 + 原型 HTML 快照（独立提交）

这些文件随后要进 `_archive/`，先提交一次确保 git 能用 rename 跟踪后续 move。

```powershell
git add `
  01_product/product-north-star.md `
  01_product/roadmap.md `
  02_architecture/technical-architecture.md `
  02_architecture/ai-meal-analysis-architecture.md `
  03_prd/mvp-0.1/mvp-0.1-prd-v0-prototype.md `
  03_prd/mvp-0.1/mvp-0.1-prd-v1-coding.md `
  03_prd/mvp-0.1/prototype-input-pack.md `
  03_prd/mvp-0.1/prototype-review.md `
  04_prototype/mvp-0.1/README.md `
  04_prototype/mvp-0.1/confirmed-screens.md `
  04_prototype/mvp-0.1/page-flow.md `
  04_prototype/mvp-0.1/prototype-assets.md `
  04_prototype/product-v1/meal-agent-product-prototype.html `
  04_prototype/product-v1/meal-agent-product-prototype-backup-20260511-113440.html `
  04_prototype/product-v1/backups/ `
  05_ai-coding/mvp-0.1-task-breakdown.md

git commit -m "docs: snapshot mvp-0.1 era docs and prototype html before archive move"
```

---

## 组 3：Phase 1 应用闭环（mock 数据 + 页面 + 组件 + store）

mock 闭环所需的页面入口、屏幕、组件、stores、styles、types、mock 服务。
不含工程配置和 Phase 2 真实服务。

```powershell
git add `
  app.json `
  app/_layout.tsx `
  app/analysis.tsx `
  app/body-profile.tsx `
  app/draw-card.tsx `
  app/feedback.tsx `
  app/food-profile.tsx `
  app/report.tsx `
  src/components/BaseCard.tsx `
  src/components/PrimaryButton.tsx `
  src/screens/index.ts `
  src/screens/AnalysisScreen.tsx `
  src/screens/BodyProfileScreen.tsx `
  src/screens/DetailScreen.tsx `
  src/screens/DrawCardScreen.tsx `
  src/screens/FeedbackScreen.tsx `
  src/screens/FoodProfileScreen.tsx `
  src/screens/HistoryScreen.tsx `
  src/screens/HomeScreen.tsx `
  src/screens/ProfileScreen.tsx `
  src/screens/RecordScreen.tsx `
  src/screens/ReportScreen.tsx `
  src/stores/ `
  src/styles/tokens.ts `
  src/types/meal.ts `
  src/services/mockMealService.ts `
  src/services/mockAnalysisService.ts `
  src/services/mockBodyPuzzleService.ts `
  src/services/mockDrawCardService.ts `
  src/services/mockRepositories.ts `
  src/services/mockSeedData.ts `
  src/services/serviceMode.ts

git commit -m "feat(phase-1): mock closed-loop screens, stores, mock services"
```

---

## 组 4：工程配置 + Phase 2 真实服务层 + 验收

依赖更新、husky、jest、eslint，加上 Phase 2 的真实服务、repositories、AI、测试，以及 Phase 2 验收清单。
打包成一组是因为 Phase 2 服务依赖新加的 npm 包，package.json 改动跟服务代码必须一起 commit 才能跑通。

```powershell
git add `
  package.json `
  package-lock.json `
  eslint.config.mjs `
  jest.config.js `
  .husky/ `
  src/services/supabaseClient.ts `
  src/services/authService.ts `
  src/services/storageService.ts `
  src/services/profileRepository.ts `
  src/services/mealRepository.ts `
  src/services/analysisRepository.ts `
  src/services/feedbackRepository.ts `
  src/services/reportRepository.ts `
  src/services/drawCardRepository.ts `
  src/services/aiSchema.ts `
  src/services/aiMealAnalysisService.ts `
  src/services/repositoryTypes.ts `
  src/services/index.ts `
  src/services/__tests__/ `
  06_delivery/phase-2-acceptance-report.md `
  06_delivery/phase-2-rls-checklist.sql

git commit -m "feat(phase-2): supabase + ai service scaffolding, repositories, tests, rls checklist"
```

---

## 提交后核验

```powershell
git log --oneline -8
git status
```

预期：

- 最近 4 条 commit 依次是 phase-2 / phase-1 / mvp-0.1 snapshot / workspace governance
- `git status` 应该是 `nothing to commit, working tree clean`（如果还有零星残留再告诉我）

---

## 备注

1. **`.husky/_`** 是 husky 自动生成的 shim，会跟 `.husky/` 一起 add，不用单独处理。
2. **未列出的文件**：
   - `node_modules/` 已被 `.gitignore` 忽略
   - `_git_status.txt` / `_git_diff_stat.txt` 是辅助文件，commit 前删掉
3. 如果某组里有文件 `git add` 报 "pathspec did not match any files"，是因为 PowerShell 处理路径时把某个文件名拆错，把它单独执行一次即可。
4. 4 个 commit 完成后，跟我说一声 "提交完了"，我立刻开始执行 `REORG_PLAN.md` §4 的文件移动操作。
