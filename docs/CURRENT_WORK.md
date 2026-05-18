# 当前工作指针

本文件用于告诉任意接手的 Agent：现在应该从哪里继续。任何 Agent 改变阶段、Sprint、任务编号、阻塞状态或下一步时，都必须更新本文件。

## 当前状态

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-05-16 00:53:46 +08:00 |
| 当前负责人 | Codex |
| 当前阶段 | Phase 1 / MVP 1.0 记录感知 |
| 当前 Sprint | Sprint 5 推荐卡与首页逻辑 / 原型对齐 |
| 当前任务编号 | Phase 1 / Prototype full analysis page and snack-as-meal |
| 状态 | DONE：新版多餐原型已改成“一张图一次独立餐次记录”；已补完整分析页、多食物组成、菜系/省份、营养明细、待反馈加餐和已反馈后记加餐路径；App 代码尚未修改 |
| 总蓝图 | `docs/02-master-blueprint.md` |
| 阶段开发文档 | `docs/phases/phase-1-mvp-1-record-awareness.md` |
| 阶段验收文档 | `docs/acceptance/phase-1-mvp-1-acceptance.md` |

## 当前并行治理任务

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-05-16 00:14:25 +08:00 |
| 负责人 | Codex |
| 任务编号 | SOP-mechanism-slimming-and-sync |
| 状态 | DONE：机制评审修正已完成；当前产品任务指针保持 Phase 1 首页三态原型确认 |

## 当前阻塞项

- Supabase 真实项目 `dhvqlojvnnuuaxqmhbbs` 已通过 direct DB URL 执行 migrations；CLI access token 被 CLI 判定格式无效，后续如需 Management API/linked workflow 仍需重新生成 token。
- 远端 `nutrition_items` 已导入 1660 条，其中中国食物成分库 1657 条；embedding 已回填 1660/1660；`东坡肉` pgvector 查询 Top1 命中 `红烧肉`，score 约 0.9314。
- 硅基流动 OpenAI-compatible API 已验证；FastAPI 可通过 `AI_PROVIDER=siliconflow` 调用真实 provider，失败时降级 mock；本地真实 provider 验证使用 60 秒超时，默认 25 秒在网络/模型排队时可能降级。
- 本次继续收紧手机号 OTP 注册/登录实现：手机号归一化、Supabase 自动建号、同机切换账号不串数据都已在代码层收口，剩下的是真实收码与 Dashboard Hook 验收。
- Android Platform Tools 已安装，真机 `PJZ110 / Android 16 / SDK 36 / arm64-v8a` 已连接；当前 ADB 可见设备 `4e5d253e`。App 可启动且首页可见，未见 FATAL/ReactNativeJS 崩溃。本机当前未检测到真实运行环境变量，只有 `.env.example` 模板文件。
- 已重新定位 Android Platform Tools：`C:\Users\a\AppData\Local\Android\Sdk\platform-tools\adb.exe`；ADB reverse `tcp:8000` 已设置；真机 App 可启动且进程存在。
- 本机已写入 gitignored `.env` 与 `services/ai/.env`；真实 secret 不提交。FastAPI 依赖已安装到本机忽略目录 `services/ai/.runtime-deps/`。
- 当前登录页已收敛为手机号验证码登录入口，`sendPhoneOtp` 走 Supabase OTP 自动建号，切换账号时不会再保留上一位用户的 `report`、`activeMealId` 或本地列表状态。
- `src/services` 里的用户数据读取都按 `user_id` 收口，`analysisRepository.getAnalysisByMeal()` 和本地列表接口在缺 session 时不再回退出旧/假数据。
- `eslint.config.mjs` 已补齐 Node/Jest 全局，脚本和测试可以继续作为质量门。
- 已用 Cloudflare Quick Tunnel 临时暴露本机 FastAPI，公网 `/health` 返回 200，`POST /v1/auth/send-sms-hook` 不带 token 返回 401；临时 URL 只在本机 tunnel 进程存活期间有效，重启后会变化。
- 登录页已新增并置顶“跳过登录，先体验”入口；页面可滚动，半登录/待建档状态也能看到；进入后 `guestMode=true`，使用 mock profile，不写真实 Auth / Supabase。
- 开发体验已优化：`npm run metro:debug` 默认不再带 `--clear`，只在显式 `-- --clear` 时清缓存；新增 `npm run android:restart`，只做 adb reverse、force-stop 和启动 App，已在真机验证。
- 当前仍存在既有未跟踪文件：`_archive/docs-restructure-20260512/image.png`，本轮未处理。

## 下一步建议

1. 用户刷新新版原型，确认首页三态、完整分析页、多食物组成、菜系/省份、营养明细、待反馈加餐、已反馈后记加餐和超时补反馈路径。
2. 原型确认后，再进入 App 首页状态机、记录分析页、反馈页、历史页和数据结构实现。
3. 登录/短信链路后续仍需继续完成 Supabase Hook 真机收码验收。

## 最近一次交接摘要

2026-05-14 11:39:01 +08:00 已新增通用开发 SOP 方案库：`docs/development-sop/README.md` 和 `docs/development-sop/LATEST.md`。后续新需求应先按该 SOP 完成需求澄清、原型确认、产品评估和前置资源 Gate，再进入阶段开发。

2026-05-14 12:14:18 +08:00 完成 Phase 1 真实资源接入推进：新增营养库本地 catalog、导入脚本和文档；FastAPI `/v1/nutrition/search` 可读取用户提供的 GitHub 数据源，source_count=1657，`红烧肉` 精确命中，`东坡肉` 命中 `红烧肉`；生成的 Supabase seed SQL 写入被忽略目录 `supabase/generated/`；Android APK 已安装到真机并启动；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍不能标记完整完成，原因是 Supabase 真实项目未登录执行、AI provider 缺 base URL/模型协议、真机 UI 链路和 24 小时稳定性未完成。

2026-05-14 16:16:10 +08:00 完成真实 Supabase 数据层推进：远端执行 `000_pgvector_nutrition.sql`、`001_phase1_core_tables.sql`、`002_phase1_app_contract_alignment.sql`；创建 `meal-photos` bucket 和 4 条 Storage policy；通过 REST service role 导入中国食物成分库 1657 条，远端 `nutrition_items` 总数 1660；修正 `profileRepository` 使用 `user_id` 对齐当前 schema；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍未完整完成：embedding 未生成、真实 AI provider 未接、真机完整 UI 链路未验证。

2026-05-14 17:15:03 +08:00 完成真实 AI provider 与 nutrition embeddings 推进：硅基流动 `/v1/embeddings`、`/v1/chat/completions` 验证通过；`BAAI/bge-m3` 1024 维 embedding 补齐到 Supabase `vector(1536)`，远端 `nutrition_items.embedding` 1660/1660 非空；`东坡肉` 向量检索 Top1 命中 `红烧肉`，score 约 0.9314；FastAPI 新增 `AI_PROVIDER=siliconflow` provider 和 mock fallback；`npm run lint`、`npm run typecheck`、`npm test` 通过。Phase 1 仍未完整完成：真机照片/signed URL/移动端 UI 完整闭环、Auth UI 与真实用户建档链路仍需验收。

2026-05-14 17:34:29 +08:00 完成移动端 signed URL 代码链路：Storage 上传后生成 10 分钟 signed URL；分析前可把本地餐图或持久化 Storage path 转为 signed URL；mock storage 和测试已补齐；`npm run lint`、`npm run typecheck`、`npm test` 通过；Android 真机 App 首页可见且无崩溃。Phase 1 仍未完整完成：当前运行环境没有真实 `.env`/进程环境变量，无法验收真实 Supabase 上传、真实 signed URL 和 SiliconFlow vision 餐图识别端到端链路。

2026-05-14 21:30:43 +08:00 完成真实 env 与后端链路验收：用户批准后写入本机 gitignored `.env` 和 `services/ai/.env`；安装 FastAPI 依赖到忽略目录 `services/ai/.runtime-deps/`；上传合成餐图到私有 Supabase `meal-photos`，生成 signed URL，并通过 FastAPI `AI_PROVIDER=siliconflow` 调用 SiliconFlow vision，返回结构化营养结果且未降级；ADB reverse `tcp:8000` 已设置，真机 App 可启动。Phase 1 仍未完整完成：当前真机安装包未确认加载最新 JS/env，UI 内实拍链路仍需 dev server、EAS update 或重新构建后验收。

2026-05-15 23:27:22 +08:00 新增首页多餐状态机对齐原型：`docs/prototype/meal-agent-product-prototype-home-multi-meal-20260515.html`。该原型覆盖默认卡、分析后待开始、30 分钟内待反馈、同餐追加分析、整餐反馈、已反馈 30 分钟收据、30 分钟后主卡恢复默认、当天未反馈提示和打卡日历最近未反馈定位；App 代码尚未改动，等待用户确认。

2026-05-15 23:34:57 +08:00 按用户浏览器反馈微调新版原型：超时未反馈餐不再在首页“今天”列表重复显示，只保留黄色未反馈提示入口；首页已分析/待开始卡移除“重拍 / 换图”，拍后首页只保留“好的，去吃了”。App 代码尚未改动。

2026-05-15 23:43:10 +08:00 新增经验教训索引机制：`docs/lessons/LESSONS_INDEX.md`。后续 AI 必须先检索经验索引并对照适用范围/触发症状；每次 END 记录必须写“本次问题-解决方案-经验教训”；只有可复用、已验证、高风险或易重复问题才晋升索引，首条为 `LESSON-0001`。

2026-05-16 00:19:04 +08:00 收敛首页多餐原型为三态：默认、30 分钟内待反馈、默认卡 + 今日超时未反馈提示；移除已分析待开始和已反馈收据主卡；分析退出不创建餐次，点“好的，去吃了”才创建待反馈餐；提交反馈后首页恢复默认。App 代码尚未改动，等待用户刷新确认。

2026-05-16 00:20:59 +08:00 完成整体机制修正：任务流程新增 L0-L3 分级；END 模板区分本任务验收和阶段验收影响范围；`RESOURCE_REGISTRY` 已同步真实资源状态；`LESSONS_INDEX` 增加 ACTIVE / SUPERSEDED / OBSOLETE、最后验证环境和失效条件；流程治理任务以后写入“当前并行治理任务”，不得覆盖产品主线指针。
