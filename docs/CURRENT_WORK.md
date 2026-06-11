# 当前工作指针

本文件用于告诉任意接手的 Agent：现在应该从哪里继续。任何 Agent 改变阶段、Sprint、任务编号、阻塞状态或下一步时，都必须更新本文件。

## 当前状态

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-06-04 |
| 当前负责人 | Claude |
| 当前阶段 | Phase 1 / MVP 1.0 记录感知 |
| 当前 Sprint | ##042 反馈字段对齐 + Block1 算法规格（已完成） |
| 当前任务编号 | ##049 three-state-page-redesign（已完成） |
| 状态 | ##049 已完成：餐次三状态页面重构 + 原型同步开发。确立「饭前分析页=建议预测 / 饭后总结页=实际摄入+反应 / 记录页=归档回看」三视角，三页共用同一份数据不再各造字段。分析页删结构观察+可能饭后反应、改顺序为 名称→副标→组成→建议→营养、单食物组成不重复菜名、建议三锚点不截断；饭后总结页删「这一餐记完了」改菜名主标+场景餐次时间副标、实际摄入加纤维；记录页重构为单卡+分界线（基础信息含饭后感受 emoji 无字段名 → 实际摄入 → 反应预测 → 饭前建议折叠）、删价格、删与实际摄入重复的洞察。`advice` 废弃为兜底，死代码已清理。phase/acceptance 文档 2026-06-04「三状态页面重构」节已同步。下一步：触发「进入开发」门控 → Phase 1 AI 服务层脚手架（T2-04a） |
| 总蓝图 | `docs/02-master-blueprint.md` |
| 阶段开发文档 | `docs/phases/phase-1-mvp-1-record-awareness.md` |
| 阶段验收文档 | `docs/acceptance/phase-1-mvp-1-acceptance.md` |

## 当前并行治理任务

| 字段 | 内容 |
|---|---|
| 更新时间 | 2026-06-03 |
| 负责人 | Codex |
| 任务编号 | ##049 shared-project-ops |
| 状态 | DONE：并行工程治理任务完成。已接入共享项目操作脚本机制，新增项目级 preflight / commit / release 入口；消除单机绝对项目路径硬编码；`.\scripts\preflight.ps1` 已通过；不覆盖当前产品主线任务指针。 |

## 历史并行治理任务

| 任务编号 | 状态摘要 |
|---|---|
| ##045 architecture-docs-restructure | DONE：架构文档治理大重构完成。蓝图从 4140 行瘦身到 1714 行（-59%）；新增 docs/architecture/ 下 10 个文档（README + 9 个专题）；P1 F6-F9 + P2 F10 全部落地；docs/00-INDEX.md 新增工程架构文档分区。遗留 P2 F11（cost-model 双栏）待 Phase 1 上线后处理 |
| ##044 strategic-gaps-fill-p0 | DONE：P0 五项落地——蓝图新增「产品形态战略 App+MCP」+「用户分层与产品形态对应」；商业方案扩四档（新增 ④ 托管饮食 ¥128/月 Phase 2 验证）+ 免费版改精度限制 + 转化钩子前移到第 1/3/5-7 天 + 托管派识别信号 |
| ##019 blueprint-stage-independence-and-cross-cutting-insight | DONE：已在蓝图固化「阶段独立完整性」+「模块独立 + 横切层架构」两条上位原则，并要求 UI 不暴露 Phase 号 / Schema 不预留未来字段 / 身体洞察唯一对外表达是 4 块身体拼图 |

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

1. **FastAPI 对齐（可选，Phase 2 前必须）**：`services/ai/routers/analyze.py` 的响应体补 `adviceStage`、`nutrition`（结构化 `{calories,protein,carbs,fat}`）、`tags`（审批列表）、`recognizedFoods[].confidence`，使 `aiSchema.ts` 的新解析函数在真实 AI 链路中能完整工作。
2. **DrawCardScreen 展示槽位信息**：`src/screens/DrawCardScreen.tsx` 读取 `card.slotLabel`/`card.badge` 并在卡片 UI 上展示，验证新字段端到端可见。
3. **防止下次类型漂移**：建立 Phase 边界合约检查机制（见本次 “建立机制” 说明），在每次蓝图升级 Phase 时优先对齐类型文件再改业务代码。

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

2026-05-18 11:57:38 +08:00 已将首页多餐规则同步到主母版 `docs/prototype/meal-agent-product-prototype.html`：首页改为记录驱动的默认 / 待反馈 / 今日超时未反馈提示；“又吃/喝了别的”改为独立加餐记录；分析页保留主原型质量并补单/多食物标题、菜系/省份、多食物拆分和营养明细；打卡日历支持未反馈红框与目标餐定位。App 代码仍未改动。

2026-05-18 15:31:58 +08:00 已把主原型变更同步到 `docs/phases/phase-1-mvp-1-record-awareness.md`，并在 `AGENTS.md` 固化“原型修改必须评估真实 App 可复用性”的规则。App 代码仍未改动。

2026-05-18 15:40:08 +08:00 用户指定触发词“原型同步开发”后，必须自动启动原型到工程同步 SOP：读取主原型，抽取状态机/字段/资产/验收口径，同步阶段开发文档、任务表、验收文档、`CURRENT_WORK` 和 `TASK_LOG`；用户确认定稿前仍禁止进入 App 代码开发。

2026-05-18 15:55:10 +08:00 主原型菜系地图曾临时替换为手绘静态底图 + 省份点位高亮；用户指出这不是真实中国地图，该方案已废弃，不应继续对标开发。

2026-05-18 16:02:58 +08:00 主原型菜系地图已改为使用 GitHub ECharts 4.0.2 `map/json/china.json` 本地资产：`docs/prototype/assets/china-echarts-4.0.2.json` 和 `.js`。主原型通过解码 GeoJSON 渲染省级轮廓，并继续按 `meal.province` 点亮已吃省份、点击查看餐次。当前不改 App 代码；后续 App 可复用数据和解码逻辑，是否引入 `react-native-svg` 另行确认。

2026-05-18 16:33:45 +08:00 已执行“原型同步开发”的文档同步部分：`docs/acceptance/phase-1-mvp-1-acceptance.md` 新增主原型同步验收修订，并清理旧 `additionals`、`未打分`、`PENDING_FB/DONE` 验收口径；`docs/phases/phase-1-mvp-1-record-awareness.md` 已补 ECharts 4.0.2 地图资源来源、license 复核、UTF8 解码、投影、省级 path、`react-native-svg` 与降级边界。App 代码仍未改动。

2026-05-18 16:50:07 +08:00 已按用户截图反馈删除主原型菜系地图顶部标题区：移除“美食版图”和“已解锁 X / 34 个省份菜系”两行文字；地图、地图说明、统计卡和已解锁列表保留。修改前已备份到 `_archive/prototype-history/meal-agent-product-prototype-20260518-164819-before-map-title-removal.html`。

2026-05-18 16:52:58 +08:00 已执行“原型同步开发”的标题区同步部分：`docs/phases/phase-1-mvp-1-record-awareness.md` 和 `docs/acceptance/phase-1-mvp-1-acceptance.md` 已明确真实 App 菜系地图 Tab 内不再渲染“美食版图”和“已解锁 X / 34 个省份菜系”，解锁数量保留在下方统计卡；`src/screens/HistoryScreen.tsx` 尚未修改。

2026-05-18 17:15:10 +08:00 已按用户指定方案更新主原型菜系地图：地图页不再显示公共餐次筛选行；三个统计块移到地图上方；地图圆圈标点全部删除，点亮省份用色块 + 中心 icon；已解锁菜系列表点击后在同一容器切换为菜系时间轴记录，并提供全部时间/年份和餐次类型筛选。App 代码仍未改动。

2026-05-18 23:05:35 +08:00 已执行“原型同步开发”：主原型近期饮食日历和菜系地图调整已同步到 `docs/phases/phase-1-mvp-1-record-awareness.md` 与 `docs/acceptance/phase-1-mvp-1-acceptance.md`。同步内容包括：饮食日历命名、累计餐次总览、当月饮食餐次/记录天数、年月选择器只选年月、右上餐次筛选 Tab、日期格反馈状态色块、当日记录 X/Y 计数；菜系地图统计块上移、省份色块 + icon + 名称、同容器菜系时间轴、年份/月/餐次筛选和 X/Y 计数语义。App 代码仍未改动，等待用户确认后再进入真实开发。

2026-05-19 15:08:40 +08:00 已按用户确认同步主原型营养库协作机制：分析页营养概览显示营养来源标签，食物组成行显示单项匹配状态，营养明细弹层说明营养库/AI估算来源、数据版本和上游 GitHub 不自动入生产库的治理规则。已建立每周一 09:00 的“营养库数据源更新巡检”自动化，用于追踪上游变化、检查差异、评估影响、建立更新与回退方案；涉及生产 Supabase、embedding 或付费外部 API 时仍需用户批准。App 代码仍未改动。

2026-05-19 15:44:10 +08:00 已完成 Phase B/C/D：FastAPI 增加本地原型 CORS 和 `/v1/nutrition/search` 的 `limit` 参数；主原型分析页会真实调用 `http://127.0.0.1:8000/v1/nutrition/search`，命中后回写营养库匹配项、置信度、单项营养贡献和汇总估算，接口不可用则明确显示“营养库未连接”；Phase 1 开发文档和验收文档已同步真实链路口径。本机 FastAPI 已启动，`curl` 验证东坡肉命中红烧肉；当前未配置全量本地营养数据目录，source_count 为 1。

2026-05-19 15:43:54 +08:00 已按用户确认重构主原型分析页饭前布局：分析页现在按餐次选择、图片、分析结果+建议、营养概览、打卡提示和按钮五块表达；菜名、点评、建议和餐食组成合并到“分析结果+建议”卡；顶部重复菜系/场景/营养摘要删除；原“进食建议”整卡和饭前“可能饭后反应”渲染移除；真实营养库回填仍会刷新分析结果卡和营养概览。App 代码仍未改动。

2026-05-19 16:31:19 +08:00 已按用户确认把六个阶段的建议方式同步到主原型：产品架构图新增“建议能力递增”横向滑动卡片，覆盖通用建议、反馈建议、身体拼图建议、身体结构建议、计划履约建议、食材记忆建议，并用“记录 -> 反馈 -> 规律 -> 结构 -> 计划 -> 履约 -> 食材记忆 -> 下一轮建议”收束为递增循环；分析结果卡的建议区域新增轻量来源标签，当前按身体拼图状态和 `adviceStage` 字段推断。App 代码仍未改动。

2026-05-19 16:39:55 +08:00 已执行“原型同步开发”：`docs/phases/phase-1-mvp-1-record-awareness.md` 已同步分析页五块结构、真实营养库链路、`adviceStage` 建议来源枚举、六阶段建议能力递增循环和 React Native 可复用边界；`docs/acceptance/phase-1-mvp-1-acceptance.md` 已同步 T2-05/T5-06 和主原型验收口径。App 代码仍未改动，等待用户确认同步方案定稿。

2026-05-19 16:51:04 +08:00 已按用户要求只修改主原型餐前抽卡 / 推荐卡：翻牌主结果新增轻量推荐来源标签，结果下方新增“推荐依据阶段”横向滑动卡片，覆盖通用推荐、反馈推荐、身体拼图推荐、身体结构推荐、计划履约推荐、食材记忆推荐，并复用同一份六阶段数据到产品架构页；已预留 `recommendationStage`、`recommendationStageLabel`、`recommendationReason`、`recommendationSources`、`unlockRequirement`、`confidenceLevel` 字段语义。修改前已备份主原型；App 代码仍未改动。
