# Phase 0 / Phase 1 差异审计

## 1. 审计时间

- 2026-05-13 22:19:26 +08:00

## 2. 审计 Agent

- Codex

## 3. 依据文档

- `README.md`
- `AGENTS.md`
- `docs/00-INDEX.md`
- `docs/01-ai-working-manual.md`
- `docs/CURRENT_WORK.md`
- `docs/TASK_LOG.md`
- `docs/02-master-blueprint.md`
- `docs/phases/phase-0-foundation.md`
- `docs/acceptance/phase-0-acceptance.md`
- `docs/phases/phase-1-mvp-1-record-awareness.md`
- `docs/acceptance/phase-1-mvp-1-acceptance.md`

## 4. 当前代码概况

当前工程是根目录 Expo App，主要目录为 `app/` 与 `src/`，尚未迁移到蓝图目标结构 `apps/mobile/ + services/ai/ + supabase/`。

已有内容：

- Expo Router 路由入口：`app/_layout.tsx`、`app/index.tsx` 及多个页面路由。
- React Native 页面壳：Home、Record、Analysis、Feedback、Detail、History、Profile、Report、DrawCard 等。
- Zustand 状态：`src/stores/bodyPuzzleStore.ts`。
- 基础样式 token：`src/styles/tokens.ts`。
- 基础组件：`BaseCard`、`PrimaryButton`、`EmptyState`、`LoadingState`。
- mock 服务、mock seed、mock repositories。
- Supabase client 与部分 persistence repositories。
- AI endpoint fallback：无 endpoint 时回落 mock analysis。
- CI、EAS Update、lint/typecheck/test 命令。

本次只读验证结果：

- `npm run lint`：通过。
- `npm run typecheck`：通过。
- `npm test`：通过，7 个测试套件、12 个测试全部通过。

未运行 `npm run web`，因为该命令会启动长驻开发服务，本次审计以静态读取和质量命令为主。

## 5. Phase 0 差异

### 已完成

- Expo / React Native / Expo Router 根工程已存在，可作为当前短期主工程继续推进。
- `package.json` 中已有 `lint`、`typecheck`、`test`、`web` 等基础命令。
- TypeScript strict 配置存在。
- ESLint 配置存在，当前 lint 通过。
- Jest 配置和测试用例存在，当前测试通过。
- `.github/workflows/ci.yml` 已配置 install、typecheck、lint、test。
- `app.json`、`eas.json`、EAS preview/production update workflow 已存在。
- `.env.example` 存在，审计未发现其中包含真实密钥值。
- `src/styles/tokens.ts` 已提供 colors、spacing、radius。
- `src/components/` 已有基础组件雏形。

### 部分完成

- 主题系统只有 colors、spacing、radius，缺少 typography/font、shadow、组件尺寸等长期复用 token。
- 基础组件库只有 Button/Card/Empty/Loading，缺少 Phase 0 明确要求的 Input、Tag、Error 等。
- 页面大多直接在本地 `StyleSheet` 中定义样式，仍有大量硬编码颜色、字号、尺寸，尚未达到“后续页面不重复定义基础样式”的底座目标。
- EAS Update 已配置，但本次未做 EAS Build 或真机验证。

### 未完成

- 未形成稳定的移动端设计系统导出入口，例如蓝图中提到的 `src/theme/*` 或等效结构。
- 未完成完整基础组件库。
- 未完成 web 启动验收记录。
- 未完成长期工程底座的组件规范、错误态组件和输入组件。

### 偏离蓝图

- 蓝图要求 token 统一导入、减少魔法数字；当前页面级样式仍以原型迁移为主。
- 当前已有不少 Phase 1 业务页面先于 Phase 0 底座稳定化落地，导致后续补 token 和组件库时可能需要回收页面样式。

## 6. Phase 1 差异

### 已完成

- 已有新用户/老用户演示入口。
- 已有建档页、记录页、分析页、反馈页、详情页、历史页、报告页、抽卡页。
- 已有 mock 餐次创建、mock 分析、mock 反馈、mock report、mock draw card。
- Zustand store 可驱动原型闭环。
- Supabase client 已存在。
- `meals`、`profiles`、`analyses`、`feedbacks`、`draw_cards` 等部分 repository 已有 Supabase 直连尝试和 mock fallback。
- AI 分析 service 可调用 `EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT`，失败或未配置时 fallback 到 mock。
- 历史、详情、反馈、报告等核心页面可基于 mock 数据演示。

### 部分完成

- Auth 只有匿名登录和 mock fallback，不是完整注册/登录/退出体系。
- Profile repository 存在，但字段和蓝图 `profiles` 表结构未完全一致。
- 餐次、分析、反馈 repository 有 Supabase 直连，但不是 SQLite 本地优先。
- AI 分析只是移动端直接请求 endpoint 或 fallback mock，不是蓝图 FastAPI `/v1/meal/analyze` + Supabase JWT + 营养库匹配流程。
- 推荐卡和身体报告目前由移动端 mock/service 生成，不是 FastAPI 算法服务生成。
- EAS Update 已有，但 Sprint 6 的 EAS Build、内测分发、稳定性验证未完成。

### 未完成

- `expo-sqlite` 本地优先数据层。
- SQLite schema、migration、repository、同步队列。
- Supabase migrations、RLS、Storage bucket、seed 数据。
- pgvector 营养向量库。
- FastAPI AI Service。
- Anthropic Vision 分析服务。
- OpenAI embedding 营养库向量化流程。
- 真相机拍照：`expo-camera` 未接入。
- 图片压缩/裁剪：`expo-image-manipulator` 未接入。
- 饭前/饭后图片上传闭环。
- `daily_checkins` 每日回访和 meals 关联。
- `expo-notifications` 本地提醒。
- `weight_logs` 时序体重记录。
- 断网可记录、联网后同步、同步重试。
- 离线横幅、错误 toast、AI 失败完整兜底。
- Sentry 或等效错误监控。
- Android 真机 24 小时稳定性验证。
- meals 表数据完整率 > 95% 的真实数据验收。

### 偏离蓝图

- 当前实现更像“Phase 1 原型壳 + 部分 Supabase 直连”，不是蓝图要求的“SQLite 本地优先 + 后台同步 Supabase + FastAPI 算法服务”。
- 数据表命名与蓝图不一致：代码中使用 `analyses`、`feedbacks`、`draw_cards` 等，蓝图中是 `meal_analysis`、`meal_feedback`、`card_actions` 等。
- 移动端存在 AI endpoint 调用入口；蓝图原则要求算法和模型调用在 FastAPI 服务中，移动端只请求后端服务。
- 页面里提前出现“计划”“身体结构 / MVP 4.0”等后续阶段概念，可能削弱 Phase 1 “记录感知”的产品聚焦。
- `.env.example` 中出现 `OPENAI_API_KEY`、`SENTRY_DSN` 等非 `EXPO_PUBLIC_*` 项。虽然为空，但真实 AI secret 不应进入移动端环境边界。

## 7. 需要用户确认的事项

- 是否先补齐 Phase 0，再进入 Phase 1。
- 是否保持当前根目录工程结构，暂不迁移到 `apps/mobile/ + services/ai/ + supabase/`。
- 是否批准新增原生依赖：`expo-sqlite`、`expo-camera`、`expo-image-manipulator`、`expo-notifications`。
- 是否批准创建 `supabase/migrations`、RLS、Storage bucket、seed 数据。
- 是否已有 Supabase 项目、区域、Anon Key、Service Role Key 的安全注入方式。
- 是否批准创建 `services/ai` FastAPI 服务。
- 是否已有 Anthropic API Key、OpenAI API Key，并确认只放入后端环境。
- 是否确认营养库数据来源和初始 seed 规模。
- 是否移除或隐藏当前 UI 中超出 Phase 1 的“计划”“身体结构 / MVP 4.0”等入口。
- 如何处理既有未跟踪文件 `_archive/docs-restructure-20260512/image.png`。

## 8. 推荐执行顺序

建议先补 Phase 0，再进入 Phase 1。

理由：

- Phase 1 已有可演示原型，但底座尚未稳定，继续堆业务会扩大后续重构范围。
- SQLite 本地优先、Supabase migrations、FastAPI、pgvector 都是 Phase 1 的关键基础，不应在页面逻辑已扩散后再补。
- 先收敛 token、组件、环境变量边界和质量门禁，可以降低后续 Android/iOS 双端和热更新风险。

推荐顺序：

1. Phase 0 补齐：主题 token、基础组件、环境变量边界、质量门禁、web 启动验收。
2. Phase 1 Sprint 1：Auth、Profile、SQLite、本地 repository、Supabase migrations、pgvector 初始化。
3. Phase 1 Sprint 2：Camera、Image Manipulator、Storage、FastAPI `/v1/meal/analyze`、AI 分析结果页。
4. Phase 1 Sprint 3：饭后反馈、每日回访、通知提醒、回访关联餐次。
5. Phase 1 Sprint 4：历史详情、体重记录、档案完整编辑。
6. Phase 1 Sprint 5：首页状态机、推荐卡、7 天解锁、首批洞察。
7. Phase 1 Sprint 6：离线同步、错误处理、性能、Sentry、EAS Build、内测分发。

## 9. Phase 0 补齐任务清单

- 补 typography/font token。
- 补 shadow/opacity/组件尺寸 token。
- 建立统一 theme 导出入口。
- 补 Input 组件。
- 补 Tag 组件。
- 补 ErrorState 组件。
- 审视现有 BaseCard / PrimaryButton / EmptyState / LoadingState API，收敛为长期可复用组件。
- 清理页面中最高频的硬编码颜色、字号、间距，优先替换为 token。
- 补 `.env.example` 边界，只保留移动端需要的 public env，后端 secret 单独在后端样例中定义。
- 补 `npm run web` 启动验收记录。
- 保持 `npm run lint`、`npm run typecheck`、`npm test` 通过。

## 10. Phase 1 补齐任务清单

Sprint 1：

- 明确是否启用 Supabase Auth 的注册/登录方式。
- 实现登录状态、退出登录和 session 持久化。
- 对齐 Profile 数据模型。
- 新增 SQLite schema、migration、repository。
- 设计本地优先写入和后台同步边界。
- 创建 Supabase core migrations 与 RLS。
- 创建 `nutrition_items` pgvector migration。
- 准备营养库 seed 流程。

Sprint 2：

- 接入 `expo-camera`。
- 接入 `expo-image-manipulator`。
- 实现 meal_images / Storage 上传。
- 创建 FastAPI 服务骨架。
- 实现 `/v1/meal/analyze`。
- 实现 Supabase JWT 校验。
- 实现 AI Vision 分析和结构化 JSON 校验。
- 实现营养库精确匹配、pgvector 搜索和 AI fallback。
- 将分析结果保存到本地和 Supabase。

Sprint 3：

- 完成饭后反馈字段与蓝图表结构对齐。
- 实现 daily_checkins。
- 实现回访和 meals 关联。
- 接入 `expo-notifications` 本地提醒。
- 实现错过反馈和次日回访策略。

Sprint 4：

- 历史列表改为真实数据驱动。
- 单餐详情展示 meal、analysis、feedback、image。
- 实现 `weight_logs` 时序记录。
- 完整档案编辑和保存。
- 增加数据管理入口前的二次确认和安全边界。

Sprint 5：

- 首页状态机改为真实数据驱动。
- 推荐卡写入 `card_actions` 或蓝图确认后的等效表。
- 把规则引擎放入 FastAPI 或明确移动端 fallback 边界。
- 实现 7 天解锁统计。
- 实现首批洞察生成和展示。

Sprint 6：

- 实现断网可记录。
- 实现联网后同步。
- 实现同步失败重试队列。
- 增加离线横幅和错误 toast。
- 完善 AI 失败处理：重试、换图、用模拟结果继续。
- 历史列表性能优化。
- 接入 Sentry 或等效错误监控。
- 执行 EAS Build preview。
- 完成 Android 真机稳定性和内测分发验收。

## 11. 风险和阻塞项

- Phase 0 未补齐前继续扩展业务，会扩大样式和组件返工。
- 当前 Supabase 表名和蓝图表名不一致，后续 migrations 需要一次性校准，避免数据层双轨。
- 当前没有 SQLite，本地优先和离线可记录是 Phase 1 最大架构缺口。
- 当前没有 FastAPI，AI、营养匹配、推荐和洞察逻辑都仍在移动端或 mock 层，偏离算法独立热更新原则。
- 原生依赖未获批准前，Camera、SQLite、Notifications、Image Manipulator 均不能落地。
- Supabase migrations、RLS、pgvector 未获批准前，无法进入真实数据闭环。
- AI secret 未获批准并安全注入前，不能接真实模型。
- 没有真机/EAS Build 验证前，不能判断 Android/iOS 原生能力和热更新稳定性。
- `_archive/docs-restructure-20260512/image.png` 仍是未跟踪文件，需用户确认保留、提交或删除。
