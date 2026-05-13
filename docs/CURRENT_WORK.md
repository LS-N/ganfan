# 当前工作指针

本文件用于告诉任意接手的 Agent：现在应该从哪里继续。任何 Agent 改变阶段、Sprint、任务编号、阻塞状态或下一步时，都必须更新本文件。

## 当前状态

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-05-13 23:11:13 +08:00 |
| 当前负责人 | Codex |
| 当前阶段 | Phase 1 / MVP 1.0 记录感知 |
| 当前 Sprint | Sprint 1-6 基础闭环补齐 |
| 当前任务编号 | Phase 1 / MVP 1.0 补齐 |
| 状态 | 已完成本轮真实产品基础闭环补齐；仍需真机、Supabase 项目和真实 AI provider 验收 |
| 总蓝图 | `docs/02-master-blueprint.md` |
| 阶段开发文档 | `docs/phases/phase-1-mvp-1-record-awareness.md` |
| 阶段验收文档 | `docs/acceptance/phase-1-mvp-1-acceptance.md` |

## 当前阻塞项

- 真实 Supabase 项目尚未在本机执行 migrations；`supabase/migrations/` 已准备 Phase 1 表、RLS 和 pgvector 营养库。
- FastAPI 服务已创建真实边界和 `/v1/meal/analyze` mock provider；尚未接 Anthropic/OpenAI 真实 secret。
- 已新增原生依赖和原生权限配置，后续真机/EAS Build 验证需要重新生成原生包。
- 浏览器自动化插件打开本地预览超时；Expo Web 服务本身已返回 200 且 Metro 编译完成。
- 当前仍存在既有未跟踪文件：`_archive/docs-restructure-20260512/image.png`，本轮未处理。

## 下一步建议

1. 在真实 Supabase 项目执行 Phase 1 migrations，并配置 Storage bucket `meal-photos`。
2. 本机启动 `services/ai`，将 `EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT` 指向 `/v1/meal/analyze`，再替换 mock provider 为真实 AI provider。
3. 用 Android/iOS 真机验证 Camera、Notifications、SQLite 持久化、离线记录和回访流程。
4. 执行 EAS preview build，验证新增原生依赖和权限配置。

## 最近一次交接摘要

本轮按真实产品 Phase 1 执行，不再把 mock 闭环当作完成标准：新增 SQLite 本地优先 schema/repository/sync queue，默认无 Supabase 配置时也写入本机数据库；补 DailyCheckin、WeightLog、MealImage 类型和页面流；记录页接入真实相机与图片压缩；反馈后进入每日回访；首页加入待回访状态和离线横幅；身体洞察和推荐卡收敛到 7 餐解锁，不进入 Phase 2；新增 Supabase Phase 1 migrations/RLS/seed；新增 FastAPI AI service 边界和后端 `.env.example`。`npm run lint`、`npm run typecheck`、`npm test` 均通过。
