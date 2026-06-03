# 进度简报 Routines（现成 prompt）

两条 routine 都以 `docs/TASK_LOG.md` 为数据源，产出写入 `docs/PROGRESS_LOG.md`。
把下面的 prompt 直接粘到 Routines 面板的「What do you want automated?」输入框，按建议的 schedule 设置即可。

---

## Routine 1：每日简报（工作日 21:00）

**Schedule**：每周一至周五 21:00（Asia/Shanghai）

**Prompt**：

```
读取本仓库 docs/TASK_LOG.md，找出今天（当前日期）新增或变更的 START / END 记录。
用中文为今天写一条简报，要求：
1. 只总结今天实际发生的开发动作，每条一句话，用产品/进度视角而非代码细节，最多 5 条。
2. 如果今天 TASK_LOG 没有任何新记录，则写「今日无 TASK_LOG 变更」。
把这条简报追加到 docs/PROGRESS_LOG.md 的「## 每日简报」章节顶部（最新在上），格式为「### YYYY-MM-DD」加要点列表。
同时检查 docs/CURRENT_WORK.md 的当前阶段/Sprint，如有推进则更新 PROGRESS_LOG.md 顶部「整体进度位置」的进度条与「当前位置」一行。
最后 git commit 这次改动，commit message 用「chore: 每日进度简报（YYYY-MM-DD）」。
```

---

## Routine 2：每周汇总（每周日 20:00）

**Schedule**：每周日 20:00（Asia/Shanghai）

**Prompt**：

```
读取本仓库 docs/TASK_LOG.md 和 docs/CURRENT_WORK.md，汇总本周（周一到周日）的开发进展。
用中文写一份本周汇总，要求：
1. 本周完成了哪些任务（按 TASK_LOG 的 END 记录，每条一句话，产品/进度视角，标注任务编号）。
2. 本周未完成 / 阻塞项（参考 CURRENT_WORK 阻塞项）。
3. 对照 6 个 Phase（Phase 0 基础底座 / Phase 1 记录感知 / Phase 2 计划推荐 / Phase 3 目标干预 / Phase 4 健康整合 / Phase 5 用户履约），说明当前所处位置。
把汇总追加到 docs/PROGRESS_LOG.md 的「## 本周汇总」章节顶部（最新在上），格式为「### W周号（起止日期）」加要点。
并更新文件顶部「整体进度位置」的 Phase 进度条和「当前位置」一行，反映本周末的真实进度。
最后 git commit，message 用「chore: 每周进度汇总（YYYY-Www）」。
```

---

## 设计说明

- **为什么复用 TASK_LOG**：项目已有强制纪律——任何开发必须写 START/END，所以 TASK_LOG 是最可靠、零额外成本的数据源，不需要新建采集机制。
- **PROGRESS_LOG 与 TASK_LOG 分工**：TASK_LOG 是开发者原始流水账（带验收、经验教训、修改文件清单）；PROGRESS_LOG 是产品/进度视角的人话摘要，只回答「今天/本周做了什么、现在在哪」。
- **进度条维护**：进度百分比由 routine 依据 CURRENT_WORK 的阶段判断粗估，不追求精确，只为「一眼定位」。
