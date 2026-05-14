# 当前工作指针

本文件用于告诉任意接手的 Agent：现在应该从哪里继续。任何 Agent 改变阶段、Sprint、任务编号、阻塞状态或下一步时，都必须更新本文件。

## 当前状态

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-05-14 12:14:18 +08:00 |
| 当前负责人 | Codex |
| 当前阶段 | Phase 1 / MVP 1.0 记录感知 |
| 当前 Sprint | Sprint 1-6 真实资源接入与真机验收 |
| 当前任务编号 | Phase 1 / MVP 1.0 真实资源接入 |
| 状态 | Phase 1 真实资源接入推进完成一轮；仍不能标记 Phase 1 全完成 |
| 总蓝图 | `docs/02-master-blueprint.md` |
| 阶段开发文档 | `docs/phases/phase-1-mvp-1-record-awareness.md` |
| 阶段验收文档 | `docs/acceptance/phase-1-mvp-1-acceptance.md` |

## 当前阻塞项

- Supabase CLI 已通过临时 npm 安装到 `%TEMP%\supabase-cli-npm` 并可输出 `2.98.2`；但非 TTY 环境无法执行浏览器自动登录，仍需要 `SUPABASE_ACCESS_TOKEN`、项目 ref、项目 URL/anon key/service role key，或用户在本机交互终端先完成 `supabase login`。
- 用户提供了测试 AI key，但没有提供 API base URL、模型名、请求协议是否 OpenAI-compatible；不能安全接真实 provider，只能继续使用后端 mock/本地 catalog 验收服务边界。
- 营养库 GitHub 已克隆到 `%TEMP%\china-food-composition-data`；新增本地 catalog 和 seed 生成脚本，可生成 1657 条 `nutrition_items` SQL，但未在真实 Supabase 项目执行，embedding 也未生成。
- Android Platform Tools 已安装，真机 `PJZ110 / Android 16 / SDK 36 / arm64-v8a` 已连接；APK 已安装并启动，`pid` 存在且 logcat 看到 Expo JS bundle `Running "main"`，未见 FATAL/ReactNativeJS 崩溃；但设备当前 ADB 截屏为黑屏/系统遮罩，UI 手工链路和 24 小时稳定性未完成。
- 当前仍存在既有未跟踪文件：`_archive/docs-restructure-20260512/image.png`，本轮未处理。

## 下一步建议

1. 用户提供 `SUPABASE_ACCESS_TOKEN`、Supabase project ref、项目 URL、anon key、service role key；或在本机交互终端完成 `supabase login` 后通知 Agent。
2. 用户提供测试 AI key 对应的 API base URL、模型名、请求格式；确认是否 OpenAI-compatible。
3. 解锁/保持 Android 真机亮屏，并在 App 中手动或允许 Agent 继续通过 ADB 点击执行注册、建档、拍照、分析、反馈、回访链路。
4. 真实 Supabase 可用后执行 migrations、Storage bucket、nutrition seed、embedding 生成和断网同步验收。

## 最近一次交接摘要

2026-05-14 11:39:01 +08:00 已新增通用开发 SOP 方案库：`docs/development-sop/README.md` 和 `docs/development-sop/LATEST.md`。后续新需求应先按该 SOP 完成需求澄清、原型确认、产品评估和前置资源 Gate，再进入阶段开发。

2026-05-14 12:14:18 +08:00 完成 Phase 1 真实资源接入推进：新增营养库本地 catalog、导入脚本和文档；FastAPI `/v1/nutrition/search` 可读取用户提供的 GitHub 数据源，source_count=1657，`红烧肉` 精确命中，`东坡肉` 命中 `红烧肉`；生成的 Supabase seed SQL 写入被忽略目录 `supabase/generated/`；Android APK 已安装到真机并启动；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍不能标记完整完成，原因是 Supabase 真实项目未登录执行、AI provider 缺 base URL/模型协议、真机 UI 链路和 24 小时稳定性未完成。
