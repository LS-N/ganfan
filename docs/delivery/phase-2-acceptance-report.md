# Phase 2 Real Data And AI 验收说明

## 范围

本次交付把 Phase 1 mock 闭环替换为 service/repository 边界下的真实 Supabase、Storage、AI endpoint 接入能力，同时保留 mock fallback。页面仍通过 Zustand store 编排，不直接调用 Supabase 或 AI。

## 已完成

- Sprint 1：补充 Jest 真实用例；新增 repository/service interface；新增 `mock | real | hybrid` service mode。
- Sprint 2：新增 Supabase client、匿名 Auth 最小路径、Profile repository；缺 env 自动回退 mock。
- Sprint 3：新增 Meal repository、Storage service；History/Detail 通过 store 加载持久化 meal 数据。
- Sprint 4：新增 AI meal analysis endpoint service、JSON schema sanitizer、Analysis repository、Correction diff 持久化。
- Sprint 5：新增 Feedback、Report、Draw Card repository；反馈、报告、抽卡决策可持久化。
- Sprint 6：补充 RLS SQL 清单；完成隐私和文案安全检查。

## 环境变量

- `EXPO_PUBLIC_SERVICE_MODE=mock | real | hybrid`
- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_AI_ANALYSIS_ENDPOINT`

缺少 Supabase env 时走 mock fallback。缺少 AI endpoint 时使用 mock analysis fallback。客户端不写 AI secret。

## 隐私和安全

- `src/` 与 `app/` 未发现 `console.*` 隐私日志。
- 图片只进入 Storage path，不存 base64。
- AI endpoint response 经过 schema sanitizer 后才进入页面。
- Analysis repository 不保存完整 AI raw，`raw` 写入为 `null`。
- 文案 sanitizer 会降级绝对化、医学化、高压表达。
- RLS 清单见 `docs/delivery/phase-2-rls-checklist.sql`。

## 已验证命令

- `npm run lint`
- `npm run typecheck`
- `npm test`

## Android/iOS 影响

本阶段只改 JS/TS service、store、screen 加载逻辑和文档。未新增相机、相册、推送、Health Connect 或其他原生依赖。

## 热更新影响

可通过 EAS Update 发布到 preview/production channel。需要真实 Supabase/AI 时，应在对应环境注入 `EXPO_PUBLIC_*` 配置。

## 是否需要重新打包

不需要。没有修改原生权限、Expo SDK、native config，也没有新增原生插件。

## 剩余风险

- Supabase 表、RLS、Storage bucket 需要在远端项目中按文档创建并验证。
- 匿名登录依赖 Supabase Auth 项目侧开启 anonymous sign-in。
- 真实 AI endpoint 需由安全服务端代理提供，客户端不会也不应保存模型 provider secret。
