# 干饭仓库重组方案（待审批）

> 本文件是 Claude 在 2026-05-13 对 `F:\ganfan` 进行结构审计后给出的重组方案。
> 在用户明确批准前，**不会移动、删除任何文件**。

---

## 1. 当前问题诊断

### 1.1 入口文档互相打架

仓库里有 **5 个**号称"你应该从这里开始读"的文件，结论彼此冲突：

| 文件 | 它指向的下一篇 |
|---|---|
| `README.md` | `05_ai-coding/current-phase.md` → `ganfan-full-implementation-plan.md` → `AGENTS.md` |
| `START_HERE.md` | `current-phase.md` → `ganfan-full-implementation-plan.md` → `AGENTS.md` |
| `AGENTS.md` | `current-phase.md` → `ganfan-full-implementation-plan.md` → `START_HERE.md` |
| `05_ai-coding/99-archive-index.md` | `00-final-product-development-spec.md` → `02-phase-1-v1-product-closed-loop.md`（并明确把 `ganfan-full-implementation-plan.md` 降级为参考） |
| `05_ai-coding/current-phase.md` | `ganfan-full-implementation-plan.md`（已被 99-archive-index 降级） |

结果：新 Agent 不知道哪个是权威。`ganfan-full-implementation-plan.md` 在两个文件里是"权威总纲"，在另一个文件里是"参考蓝图"。

### 1.2 旧任务文档和当前文档混在同一目录

`05_ai-coding/` 同时存放当前文档 + 已被备份但**原件没删除**的旧文档：

| 文件 | 状态（按 99-archive-index） |
|---|---|
| `00-final-product-development-spec.md` | ✅ 当前总纲 |
| `02-phase-1-v1-product-closed-loop.md` | ✅ 当前阶段 |
| `03-phase-2-real-data-and-ai.md` | ✅ 下阶段 |
| `99-archive-index.md` | ✅ 归档索引 |
| `current-phase.md` | ✅ 入口指针 |
| `ganfan-full-implementation-plan.md` | ⚠️ 长期蓝图（参考） |
| `phase-2-autonomous-execution-prompt.md` | ✅ 当前 prompt |
| `ai-service-tasks.md` | ⚠️ 旧 MVP 0.0/0.1 任务（已备份，原件未删） |
| `backend-tasks.md` | ⚠️ 同上 |
| `frontend-tasks.md` | ⚠️ 同上 |
| `mvp-0.0-engineering-entry.md` | ⚠️ 同上 |
| `mvp-0.1-task-breakdown.md` | ⚠️ 同上 |
| `test-cases.md` | ⚠️ 同上 |
| `codex-bootstrap-prompt.md` | ⚠️ 旧引导 prompt |
| `seed-package-migration-prompt.md` | ⚠️ 旧迁移 prompt |
| `backups/final-docs-restructure-20260512-112629/` | ✅ 备份目录 |

Grep "backend tasks" 同时命中当前目录和 backups 目录，Agent 无法判断哪个有效。

### 1.3 旧编号目录看起来仍是主目录，实际已废弃

根目录有 6 个数字编号目录，仅 `01_product` 和 `05_ai-coding` 内容是当前有效：

| 目录 | 内容 | 状态 |
|---|---|---|
| `01_product/` | product-north-star、roadmap | ✅ 当前 |
| `02_architecture/` | 11 篇 MVP 0.0 架构规范 | ⚠️ 99-archive-index 未提及，实际为废弃 |
| `03_prd/mvp-0.1/` | 4 篇 MVP 0.1 PRD | ⚠️ 已被总纲覆盖 |
| `04_prototype/mvp-0.1/` | 4 篇原型文档（保留参考） | ⚠️ 部分有用 |
| `04_prototype/product-v1/` | 1 个活原型 HTML + 50+ 备份 | ✅ HTML 当前 / ⚠️ 备份过载 |
| `05_ai-coding/` | 见 1.2 | ✅/⚠️ 混合 |
| `06_delivery/` | 3 份 MVP 0.0 空模板 | ⚠️ 废弃 |
| `docs/` | 2 篇 MVP 0.0 决策日志 | ⚠️ 废弃 |

### 1.4 `.claude/worktrees/` 里有 3 份完整仓库拷贝

```
F:\ganfan\.claude\worktrees\ecstatic-hugle-62cd6f\   ← 完整工程拷贝，含独立 .git
F:\ganfan\.claude\worktrees\sad-tu-943546\           ← 完整工程拷贝
F:\ganfan\.claude\worktrees\modest-newton-309452\    ← 完整工程拷贝
```

每份都有自己的 `app/`、`src/`、`AGENTS.md`、`package.json`，独立漂移。

- `.gitignore` 已忽略 `.claude/`，所以 git 干净。
- 但 Agent 的 Glob/Grep **不读 .gitignore**：搜索 "RecordScreen" 会同时命中根目录和 3 个 worktree。

`.git/worktrees/` 里也残留了 4 个 worktree 元数据：`ganfan`、`ecstatic-hugle-62cd6f`、`sad-tu-943546`、`modest-newton-309452`。

### 1.5 原型备份过载

`04_prototype/product-v1/backups/` 目录下：

- **50+ 个**带时间戳的 HTML 文件（20260507 ~ 20260510）
- 每个文件约 200KB-1MB
- 加上 `IMPLEMENTATION_SUMMARY.md`、`TESTING_CHECKLIST.md` 等看起来像"当前文档"实则是历史快照的 markdown

新 Agent 进入 `04_prototype/product-v1/` 看到 60+ 文件，无法快速找到唯一活原型 `meal-agent-product-prototype.html`。

### 1.6 命名约定混乱

文档里同时出现：MVP 0.0 / MVP 0.1 / MVP 1.0 / Phase 1 / Phase 2 / V1 product closed loop。彼此映射关系没有写在任何一个地方。

新 Agent 不知道 "MVP 0.1 task breakdown" 和 "Phase 1 v1 closed loop" 是不是同一件事（实际不是）。

---

## 2. 重组目标

让任何新 Agent 进入仓库后：

1. 看根目录 `ls` 立刻知道：哪是代码（`app/` + `src/`）、哪是文档（`docs/`）、哪是废弃（`_archive/`）。
2. 读 **一个** README，就知道当前阶段、技术栈、入口命令。
3. 读 **一个** `docs/00-INDEX.md`，就知道每个问题该查哪个文档。
4. 不需要判断"两份同名文档哪个是真的"——因为只剩一份。
5. 不需要担心 Grep 命中废弃 worktree。

---

## 3. 提议的目标结构

```
F:\ganfan/
│
├── README.md                       ← 唯一人类入口（合并 README + START_HERE）
├── AGENTS.md                       ← 唯一 AI Agent 契约
├── package.json
├── package-lock.json
├── tsconfig.json
├── app.json
├── eas.json
├── eslint.config.mjs
├── .env.example
├── .gitignore
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── eas-preview-update.yml
│       └── eas-production-release.yml
│
├── app/                            ← Expo Router 路由（不动）
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── record.tsx
│   ├── analysis.tsx
│   ├── feedback.tsx
│   ├── detail.tsx
│   ├── history.tsx
│   ├── report.tsx
│   ├── draw-card.tsx
│   ├── profile.tsx
│   ├── body-profile.tsx
│   └── food-profile.tsx
│
├── src/                            ← App 源码（不动）
│   ├── components/
│   ├── screens/
│   ├── services/
│   ├── stores/
│   ├── styles/
│   └── types/
│
├── docs/                           ← 所有当前文档集中在这里
│   ├── 00-INDEX.md                 ← 每个问题对应哪个文档，权威映射表
│   ├── 01-current-phase.md         ← 当前所在阶段（由 05_ai-coding/current-phase.md 迁入）
│   ├── 02-master-spec.md           ← 最终产品总纲（原 00-final-product-development-spec.md）
│   ├── 03-phase-1-closed-loop.md   ← 当前 Phase 1 文档
│   ├── 04-phase-2-real-data.md     ← Phase 2 文档
│   ├── 05-phase-2-exec-prompt.md   ← Phase 2 自主执行 prompt
│   ├── 06-long-term-blueprint.md   ← 长期蓝图（原 ganfan-full-implementation-plan.md，仅参考）
│   ├── 07-archive-index.md         ← 归档索引（更新到新位置）
│   ├── product/
│   │   ├── north-star.md
│   │   └── roadmap.md
│   └── prototype/
│       ├── README.md
│       ├── page-flow.md
│       ├── confirmed-screens.md
│       ├── prototype-assets.md
│       └── meal-agent-product-prototype.html   ← 唯一活原型
│
├── _archive/                       ← 一切只供参考、不再驱动开发的内容
│   ├── README.md                   ← 一句话：这里全部是历史快照
│   ├── mvp-0.0/
│   │   ├── architecture/           ← 原 02_architecture/* (11 篇)
│   │   ├── delivery/               ← 原 06_delivery/* (3 篇)
│   │   ├── tasks/
│   │   │   ├── ai-service-tasks.md
│   │   │   ├── backend-tasks.md
│   │   │   ├── frontend-tasks.md
│   │   │   ├── test-cases.md
│   │   │   └── mvp-0.0-engineering-entry.md
│   │   ├── prompts/
│   │   │   ├── codex-bootstrap-prompt.md
│   │   │   └── seed-package-migration-prompt.md
│   │   ├── ENGINEERING_ENTRY_DECISION.md
│   │   └── SEED_PACKAGE_V2_CHANGELOG.md
│   ├── mvp-0.1/
│   │   ├── prd/                    ← 原 03_prd/mvp-0.1/*
│   │   └── task-breakdown.md
│   ├── docs-restructure-20260512/  ← 原 05_ai-coding/backups/final-docs-restructure-20260512-112629
│   └── prototype-history/
│       ├── README.md               ← 时间戳含义说明（可选）
│       └── *.html                  ← 50+ 备份 HTML，统一收纳
│
├── node_modules/                   (gitignored)
├── .expo/                          (gitignored)
└── .git/
```

### 3.1 命名原则

- **代码目录**：保持小写、不带数字（`app/`、`src/`、`.github/`）。
- **文档目录**：单一 `docs/` 根，内部用 `NN-name.md` 双位数前缀控制阅读顺序。
- **废弃内容**：统一在 `_archive/`，下划线前缀让它在文件系统排序里靠前，但语义上清晰废弃。
- **不再使用根目录的数字前缀文件夹**（01_product/...06_delivery/）。

### 3.2 阶段命名口径

强制统一为：

- **Phase 1**：V1 产品闭环（mock 数据，已在开发中）
- **Phase 2**：真实数据与 AI（即将开始）
- **Phase 3+**：长期蓝图，见 `docs/06-long-term-blueprint.md`

弃用：MVP 0.0 / MVP 0.1 / MVP 1.0 / MVP 2.0–5.0 这些旧叫法。`docs/00-INDEX.md` 里列一张映射表给历史 commit message 用。

---

## 4. 迁移操作清单

操作以"我做哪些 move/delete/write"形式列出。**全部在用户确认后执行**。

### 4.1 创建新结构

```
mkdir docs/
mkdir docs/product/
mkdir docs/prototype/
mkdir _archive/
mkdir _archive/mvp-0.0/
mkdir _archive/mvp-0.0/architecture/
mkdir _archive/mvp-0.0/delivery/
mkdir _archive/mvp-0.0/tasks/
mkdir _archive/mvp-0.0/prompts/
mkdir _archive/mvp-0.1/
mkdir _archive/mvp-0.1/prd/
mkdir _archive/prototype-history/
mkdir _archive/docs-restructure-20260512/
```

### 4.2 文件移动（保留内容，只搬位置）

**移到 docs/：**

| 源 | 目标 |
|---|---|
| `05_ai-coding/current-phase.md` | `docs/01-current-phase.md` |
| `05_ai-coding/00-final-product-development-spec.md` | `docs/02-master-spec.md` |
| `05_ai-coding/02-phase-1-v1-product-closed-loop.md` | `docs/03-phase-1-closed-loop.md` |
| `05_ai-coding/03-phase-2-real-data-and-ai.md` | `docs/04-phase-2-real-data.md` |
| `05_ai-coding/phase-2-autonomous-execution-prompt.md` | `docs/05-phase-2-exec-prompt.md` |
| `05_ai-coding/ganfan-full-implementation-plan.md` | `docs/06-long-term-blueprint.md` |
| `05_ai-coding/99-archive-index.md` | `docs/07-archive-index.md`（内容需更新引用路径） |
| `01_product/product-north-star.md` | `docs/product/north-star.md` |
| `01_product/roadmap.md` | `docs/product/roadmap.md` |
| `04_prototype/mvp-0.1/README.md` | `docs/prototype/README.md` |
| `04_prototype/mvp-0.1/page-flow.md` | `docs/prototype/page-flow.md` |
| `04_prototype/mvp-0.1/confirmed-screens.md` | `docs/prototype/confirmed-screens.md` |
| `04_prototype/mvp-0.1/prototype-assets.md` | `docs/prototype/prototype-assets.md` |
| `04_prototype/product-v1/meal-agent-product-prototype.html` | `docs/prototype/meal-agent-product-prototype.html` |

**移到 _archive/：**

| 源 | 目标 |
|---|---|
| `02_architecture/*` (11 篇) | `_archive/mvp-0.0/architecture/` |
| `06_delivery/*` (3 篇) | `_archive/mvp-0.0/delivery/` |
| `05_ai-coding/ai-service-tasks.md` | `_archive/mvp-0.0/tasks/` |
| `05_ai-coding/backend-tasks.md` | `_archive/mvp-0.0/tasks/` |
| `05_ai-coding/frontend-tasks.md` | `_archive/mvp-0.0/tasks/` |
| `05_ai-coding/test-cases.md` | `_archive/mvp-0.0/tasks/` |
| `05_ai-coding/mvp-0.0-engineering-entry.md` | `_archive/mvp-0.0/tasks/` |
| `05_ai-coding/codex-bootstrap-prompt.md` | `_archive/mvp-0.0/prompts/` |
| `05_ai-coding/seed-package-migration-prompt.md` | `_archive/mvp-0.0/prompts/` |
| `docs/ENGINEERING_ENTRY_DECISION.md` | `_archive/mvp-0.0/` |
| `docs/SEED_PACKAGE_V2_CHANGELOG.md` | `_archive/mvp-0.0/` |
| `03_prd/mvp-0.1/*` (4 篇) | `_archive/mvp-0.1/prd/` |
| `05_ai-coding/mvp-0.1-task-breakdown.md` | `_archive/mvp-0.1/task-breakdown.md` |
| `04_prototype/product-v1/backups/*` (50+ HTML + md) | `_archive/prototype-history/` |
| `04_prototype/product-v1/meal-agent-product-prototype-backup-20260511-113440.html` | `_archive/prototype-history/` |
| `05_ai-coding/backups/final-docs-restructure-20260512-112629/*` | `_archive/docs-restructure-20260512/` |

### 4.3 删除空目录

迁移后下列目录会变空，删除：

```
01_product/
02_architecture/
03_prd/
04_prototype/
05_ai-coding/
06_delivery/
docs/（旧的，迁完废弃文件后会与新 docs/ 冲突——需先把旧 docs/ 清空再建新 docs/）
```

注意：原 `docs/` 目录会被新 `docs/` 取代。先把旧 `docs/` 的两个文件移到 `_archive/`，旧 `docs/` 会变空被删，再创建新 `docs/`。

### 4.4 改写文件

- **`README.md`**：重写为唯一人类入口；删除指向 `START_HERE.md`、`current-phase.md` 的旧链接，改指 `docs/00-INDEX.md`、`docs/01-current-phase.md`、`AGENTS.md`。
- **`AGENTS.md`**：保持作为 AI Agent 契约；更新内部所有路径指向（`05_ai-coding/current-phase.md` → `docs/01-current-phase.md` 等）；删除指向 `START_HERE.md` 的引用。
- **`START_HERE.md`**：删除（功能并入 README.md）。
- **`docs/00-INDEX.md`**：新建。内容是"想找 X，看 Y"对照表。
- **`docs/07-archive-index.md`**（原 99-archive-index.md）：更新所有路径引用，并补一节"MVP 0.0/0.1/1.0 与 Phase 1/2/3 对照表"。
- **`_archive/README.md`**：新建。一段话说明 _archive 里的内容只供参考。

### 4.5 worktree 清理（需用户确认）

- `.claude/worktrees/ecstatic-hugle-62cd6f/`
- `.claude/worktrees/sad-tu-943546/`
- `.claude/worktrees/modest-newton-309452/`

以及 `.git/worktrees/` 里的孤儿元数据：

- `.git/worktrees/ganfan/`
- `.git/worktrees/ecstatic-hugle-62cd6f/`
- `.git/worktrees/sad-tu-943546/`
- `.git/worktrees/modest-newton-309452/`

推荐处理：先 `git worktree prune` 清理孤儿元数据，再删除 `.claude/worktrees/` 整个目录。

---

## 5. 风险与回滚

- **git 历史不丢**：所有移动用 `git mv`（或在 git 外做 move 后让 git 识别为 rename），commit 历史完整保留。
- **当前未提交变更**：当前仓库有未提交的 Phase 1/Phase 2 代码改动。重组前必须先把已有未提交变更按阶段拆分并先 commit 或 stash，避免变更和重组混在一个 commit 里。
- **回滚**：所有移动都是 `git mv`，删除前会先 commit；任何一步出错都可 `git reset --hard` 退回。
- **CI 影响**：CI 工作流不读 docs，只读 `app/`、`src/`、`package.json`、`tsconfig.json`，重组对 CI 无影响。
- **EAS 影响**：EAS 不读 docs，无影响。
- **代码引用**：`app/` 和 `src/` 内部无文档路径引用，重组对运行时无影响。

---

## 6. 待用户确认的关键选择

下面 4 项一旦确认，立即开始执行：

1. **`.claude/worktrees/*` 三份完整仓库拷贝是否删除？**
   - 推荐：删除。它们是 git 忽略的工具临时产物，删除不影响主仓库；保留会持续污染 Agent 的 Grep/Glob。

2. **`04_prototype/product-v1/backups/` 里 50+ 个 HTML 备份**
   - 选项 A：全部移到 `_archive/prototype-history/`（约 30-50MB 占用，但保留细粒度回滚）
   - 选项 B：移到 `_archive/prototype-history/` 并压缩成一个 `.zip`（节省空间，仍可解压回查）
   - 选项 C：只保留最近 3-5 个时间戳，其余删除（最干净，依赖 git 历史）
   - 推荐：A（最稳妥；备份本身就是为了"以防万一"，先别折腾内容）

3. **现存数字编号目录（`02_architecture/` ... `06_delivery/`）**
   - 选项 A：全部进 `_archive/mvp-0.0/`（推荐）
   - 选项 B：合并到 `docs/`，重新筛选哪些当前还有用
   - 选项 C：保留原位不动（不推荐——会继续造成歧义）

4. **是否在执行前由用户先 commit 当前未提交变更？**
   - 强烈推荐：是。重组应该是单独的 commit，不和业务代码混。
   - 如果用户希望我帮忙拆分未提交变更，可以再开一轮分析。

---

## 7. 执行后的验证

完成后我会：

1. `git status` 确认无意外修改。
2. 用 Glob/Grep 反向验证：随便 grep 一个旧文件名，应该只在 `_archive/` 命中。
3. 重新读 `README.md` → `AGENTS.md` → `docs/00-INDEX.md`，模拟新 Agent 入场，确认链路通顺。
4. `npm run typecheck` 跑一遍（确保对源码零影响）。
5. 在 `docs/00-INDEX.md` 里写一张"如果你是新 Agent，按这个顺序读"清单。
