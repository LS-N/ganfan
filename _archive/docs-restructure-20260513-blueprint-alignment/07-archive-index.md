# 归档索引

本文件说明哪些资料只作为历史参考，不再直接驱动开发。

## 当前有效文档

| 文件 | 用途 |
|---|---|
| `docs/00-INDEX.md` | 当前唯一文档入口 |
| `docs/01-current-phase.md` | 当前阶段和边界 |
| `docs/02-master-spec.md` | 当前产品总纲 |
| `docs/03-phase-1-closed-loop.md` | Phase 1 闭环文档 |
| `docs/04-phase-2-real-data.md` | Phase 2 真实数据与 AI 文档 |
| `docs/05-phase-2-exec-prompt.md` | Phase 2 执行 prompt |
| `docs/06-long-term-blueprint.md` | 长期蓝图，仅作后续阶段参考 |
| `docs/product/` | 当前产品方向 |
| `docs/prototype/meal-agent-product-prototype.html` | 唯一活原型 HTML |

## 已归档位置

| 目录 | 内容 |
|---|---|
| `_archive/mvp-0.0/architecture/` | 旧 MVP 0.0 架构规范 |
| `_archive/mvp-0.0/delivery/` | 旧 MVP 0.0 交付模板 |
| `_archive/mvp-0.0/tasks/` | 旧任务拆解 |
| `_archive/mvp-0.0/prompts/` | 旧启动/迁移 prompt |
| `_archive/mvp-0.1/prd/` | 旧 MVP 0.1 PRD |
| `_archive/mvp-0.1/task-breakdown.md` | 旧 MVP 0.1 任务拆解 |
| `_archive/docs-restructure-20260512/` | 2026-05-12 文档重构前备份 |
| `_archive/docs-restructure-20260513/` | 本次提交和重组执行记录 |
| `_archive/prototype-history/` | 历史原型 HTML 和原型备份材料 |

## 阶段映射

| 历史叫法 | 当前解释 | 使用规则 |
|---|---|---|
| MVP 0.0 | 早期工程入场和模板文档 | 只供参考 |
| MVP 0.1 | 早期 PRD、原型、任务拆解 | 只供参考 |
| MVP 1.0 | 长期蓝图里的阶段名 | 参考，不直接覆盖 Phase 文档 |
| Phase 1 | 当前 V1 产品闭环 | 当前有效 |
| Phase 2 | 真实数据与 AI 服务准备 | 当前有效 |
| Phase 3+ | 后续个性化、计划、履约等方向 | 参考长期蓝图 |

## 使用规则

- 开发任务以 `docs/` 下当前文档为准。
- `_archive/` 中内容可以用于理解历史，但不能直接作为实现依据。
- 原型 HTML 只用于提取产品流转、页面状态和关键字段，不直接复制 DOM、CSS、localStorage 或密钥处理方式。
- 新增文档必须明确属于哪个 Phase，并写清是否是当前有效执行文档。
