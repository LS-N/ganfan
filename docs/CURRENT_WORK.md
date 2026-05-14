# 当前工作指针

本文件用于告诉任意接手的 Agent：现在应该从哪里继续。任何 Agent 改变阶段、Sprint、任务编号、阻塞状态或下一步时，都必须更新本文件。

## 当前状态

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-05-14 17:34:29 +08:00 |
| 当前负责人 | Codex |
| 当前阶段 | Phase 1 / MVP 1.0 记录感知 |
| 当前 Sprint | Sprint 3 真机照片与 Storage signed URL 验收 |
| 当前任务编号 | Phase 1 / Storage signed URL to vision provider |
| 状态 | PARTIAL：移动端 signed URL 代码链路已完成并通过真机基础启动；真实 env 未注入，真实照片到 vision provider 端到端仍未验收 |
| 总蓝图 | `docs/02-master-blueprint.md` |
| 阶段开发文档 | `docs/phases/phase-1-mvp-1-record-awareness.md` |
| 阶段验收文档 | `docs/acceptance/phase-1-mvp-1-acceptance.md` |

## 当前阻塞项

- Supabase 真实项目 `dhvqlojvnnuuaxqmhbbs` 已通过 direct DB URL 执行 migrations；CLI access token 被 CLI 判定格式无效，后续如需 Management API/linked workflow 仍需重新生成 token。
- 远端 `nutrition_items` 已导入 1660 条，其中中国食物成分库 1657 条；embedding 已回填 1660/1660；`东坡肉` pgvector 查询 Top1 命中 `红烧肉`，score 约 0.9314。
- 硅基流动 OpenAI-compatible API 已验证；FastAPI 可通过 `AI_PROVIDER=siliconflow` 调用真实 provider，失败时降级 mock；本地真实 provider 验证使用 60 秒超时，默认 25 秒在网络/模型排队时可能降级。
- Android Platform Tools 已安装，真机 `PJZ110 / Android 16 / SDK 36 / arm64-v8a` 已连接；当前 ADB 可见设备 `4e5d253e`。App 可启动且首页可见，未见 FATAL/ReactNativeJS 崩溃。本机当前未检测到真实运行环境变量，只有 `.env.example` 模板文件。
- 当前仍存在既有未跟踪文件：`_archive/docs-restructure-20260512/image.png`，本轮未处理。

## 下一步建议

1. 把移动端真实环境变量注入运行时：`EXPO_PUBLIC_SUPABASE_URL`、`EXPO_PUBLIC_SUPABASE_ANON_KEY`、`EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT`；确认移动端不持有 service role 或 AI secret。
2. 把后端真实环境变量注入运行时：`SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`、`SILICONFLOW_API_KEY`、`AI_PROVIDER=siliconflow`；启动真机可访问的 FastAPI。
3. 用真机执行拍照 -> Supabase Storage 上传 -> signed URL -> FastAPI vision analyze -> 保存分析结果的完整链路。
4. 完成后补 Phase 1 acceptance 中真实照片、Storage、AI 分析、反馈链路的 PASS/PARTIAL 标记。

## 最近一次交接摘要

2026-05-14 11:39:01 +08:00 已新增通用开发 SOP 方案库：`docs/development-sop/README.md` 和 `docs/development-sop/LATEST.md`。后续新需求应先按该 SOP 完成需求澄清、原型确认、产品评估和前置资源 Gate，再进入阶段开发。

2026-05-14 12:14:18 +08:00 完成 Phase 1 真实资源接入推进：新增营养库本地 catalog、导入脚本和文档；FastAPI `/v1/nutrition/search` 可读取用户提供的 GitHub 数据源，source_count=1657，`红烧肉` 精确命中，`东坡肉` 命中 `红烧肉`；生成的 Supabase seed SQL 写入被忽略目录 `supabase/generated/`；Android APK 已安装到真机并启动；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍不能标记完整完成，原因是 Supabase 真实项目未登录执行、AI provider 缺 base URL/模型协议、真机 UI 链路和 24 小时稳定性未完成。

2026-05-14 16:16:10 +08:00 完成真实 Supabase 数据层推进：远端执行 `000_pgvector_nutrition.sql`、`001_phase1_core_tables.sql`、`002_phase1_app_contract_alignment.sql`；创建 `meal-photos` bucket 和 4 条 Storage policy；通过 REST service role 导入中国食物成分库 1657 条，远端 `nutrition_items` 总数 1660；修正 `profileRepository` 使用 `user_id` 对齐当前 schema；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍未完整完成：embedding 未生成、真实 AI provider 未接、真机完整 UI 链路未验证。

2026-05-14 17:15:03 +08:00 完成真实 AI provider 与 nutrition embeddings 推进：硅基流动 `/v1/embeddings`、`/v1/chat/completions` 验证通过；`BAAI/bge-m3` 1024 维 embedding 补齐到 Supabase `vector(1536)`，远端 `nutrition_items.embedding` 1660/1660 非空；`东坡肉` 向量检索 Top1 命中 `红烧肉`，score 约 0.9314；FastAPI 新增 `AI_PROVIDER=siliconflow` provider 和 mock fallback；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍未完整完成：真机照片/signed URL/移动端 UI 完整闭环、Auth UI 与真实用户建档链路仍需验收。

2026-05-14 17:34:29 +08:00 完成移动端 signed URL 代码链路：Storage 上传后生成 10 分钟 signed URL；分析前可把本地餐图或持久化 Storage path 转为 signed URL；mock storage 和测试已补齐；`npm run lint`、`npm run typecheck`、`npm test` 通过；Android 真机 App 首页可见且无崩溃。Phase 1 仍未完整完成：当前运行环境没有真实 `.env`/进程环境变量，无法验收真实 Supabase 上传、真实 signed URL 和 SiliconFlow vision 餐图识别端到端链路。
