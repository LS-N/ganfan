# Phase 1: MVP 1.0 记录感知

来源：`docs/02-master-blueprint.md` 第 1920-2282 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 1 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `完整数据库 Schema`
  - `Migration 000：营养向量库（pgvector）`
  - `Migration 001：1.0 核心表`
- `API 接口规范`：`/v1/meal/analyze`、`/v1/nutrition/search`、`/v1/insight/generate` 等 1.0 相关接口。
- `功能解锁阈值`：7 天记录、身体拼图、洞察解锁等门槛。
- `省份数据常量`：美食版图和 `meals.province` 映射。
- `算法与大模型分工`：Vision 识别、营养匹配、规则引擎、首批洞察边界。
- `核心 TypeScript 类型`：Meal、MealAnalysis、Feedback、Checkin、Profile 等类型。
- `Zustand Store 接口定义`：meal/profile/checkin 等 store 约束。
- `完整 RLS 策略`：1.0 表必须受用户隔离保护。
- `FastAPI 安全规范`：JWT、速率限制、输入验证。
- `UserContext 构建逻辑（builder.py）`：AI 分析和建议必须使用的上下文。
- `Claude Prompt 模板`
  - `Prompt 1：Vision 识别`
  - `Prompt 2：个性化建议生成`
  - `Prompt 3：首批洞察生成（T5-05）`
- `环境变量规范`：移动端只使用 `EXPO_PUBLIC_*`，客户端不得保存 AI provider secret。
- `CI/CD 流水线`：移动端质量门禁和 EAS 构建边界。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

用户能完整记录餐次：拍照 -> 分析 -> 反馈 -> 回访，连续 7 天后看到第一条个人规律。

## 周期与完成判定

- 周期：6 Sprint x 2 周 = 12 周。
- 完成判定：用户连续 7 天记录，每天至少 1 餐，回访完整率 > 60%，首页出现第一条洞察。

## 前置条件

- Sprint 0 全部完成。
- 涉及 `expo-sqlite`、`expo-camera`、`expo-image-manipulator`、`expo-notifications`、Supabase migrations、FastAPI、真实 AI secret 时，必须先得到用户明确批准。

## Sprint 1: 用户体系与数据层

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T1-01 执行 Supabase Migration 001 | `supabase/migrations/001_core_tables.sql` 执行成功 | 创建 1.0 核心表并启用完整 RLS | Supabase Dashboard 中存在所有 1.0 表，完整 RLS 策略已启用 |
| T1-02 Supabase Auth 集成 | `api/supabase.ts`、登录/注册界面、`app/onboarding/index.tsx` | 手机号 OTP 注册/登录，验证码发送后自动建号，token 持久化 | 能注册新账户，登录后跳转主界面 |
| T1-03 用户建档流程 | `app/onboarding/basic-info.tsx`、`goals.tsx` | 写入 `profiles` 表并同步本地 SQLite；字段：age、gender、height_cm、goal、health_background[]、avoid | 首次登录后进入建档流程，完成后 `profiles` 表有数据 |
| T1-04 本地 SQLite 初始化 | `db/schema.ts`、`db/migrations/001.ts` | App 启动自动创建 SQLite，表结构与 Supabase 一致 | App 启动时 SQLite 数据库自动创建 |
| T1-05 营养向量库初始化 | `supabase/migrations/000_pgvector_nutrition.sql`、`nutrition_seed/cn_nutrition_db.csv`、`services/ai/nutrition/embedder.py` | 建 nutrition_items + pgvector 索引；导入 >=1000 条数据；OpenAI `text-embedding-3-small` 批量生成向量 | nutrition_items >=1000 条；embedding 非空；红烧肉精确查询有结果；东坡肉向量搜索命中红烧肉且 score >= 0.8 |

## Sprint 2: 餐次记录与 AI 分析

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T2-01 FastAPI 项目初始化 | `services/ai/`、`requirements.txt`、`main.py` | 依赖 fastapi、uvicorn、anthropic、python-dotenv、pydantic | `uvicorn main:app --reload` 在本地 8000 端口启动 |
| T2-02 Claude API 餐次分析接口 | `routers/analyze.py`、`nutrition/search.py`、`nutrition/embedder.py`、`POST /v1/meal/analyze`、`GET /v1/nutrition/search` | Vision 识别 -> 营养库精准化 -> 个性化建议；总超时 25 秒；失败降级不影响整体返回 | curl 返回 `nutrition_source`；红烧肉命中向量库；生僻菜 fallback；营养搜索返回 top5 |
| T2-03 移动端相机模块 | `app/camera.tsx`，集成 `expo-camera` | 拍照、相册选图、拍照预览确认 | 能拍照，图片显示在预览区 |
| T2-04 图片压缩与上传 | `utils/imageCompress.ts` | 压缩到 480px 最长边，JPEG 0.65，上传 Supabase Storage；写入 `meal_images`，image_type 为 wide/close/leftover | 压缩后 <100KB；`meal_images` 有记录且 image_type 正确 |
| T2-05 分析结果展示界面 | `camera.tsx` 分析结果区 | 显示菜品名、营养、风险、建议；根据 `nutrition_source` 显示营养来源；支持修改并写 `meal_corrections` | 分析结果显示正确；营养来源标签正确；修改后 corrections 有记录 |
| T2-06 餐次保存到数据库 | `db/meals.ts`、`insertMeal()`、`insertMealAnalysis()` | 先写 SQLite，后台写 Supabase，失败加入重试队列 | `meals` 和 `meal_analysis` 均有记录 |
| T2-07 进食计时与自动关闭 | `camera.tsx` 计时逻辑 | 确认分析后写 `meal_started_at`；反馈时写 `meal_duration_ms`；30 分钟未反馈写 `auto_closed_at` 并保留待反馈卡 | `meal_started_at` 有值；超 30 分钟自动关闭且首页仍显示待反馈 |
| T2-08 加料记录 | 分析结果页“还吃了别的？”入口 | 文本输入，写入 `meals.additionals = [{ name, estimate }]` | additionals 写入成功，详情页能显示 |
| T2-09 就餐心情记录 | 保存餐次前情绪快选 | 心情不错/平静/压力有点大/有点焦虑/疲惫；可跳过 | 选择后 `meals.mood` 有值；跳过为 null 且不影响保存 |

## Sprint 3: 反馈与每日回访

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T3-01 饭后即时反馈界面 | `app/feedback.tsx` | 4 题：实际吃掉多少、饱腹、即时感受、满意度；写 `meal_feedback` | 4 题全答完才能提交，数据写入正确 |
| T3-02 每日回访调度逻辑 | `utils/checkinScheduler.ts` | 早饭/午饭/加餐 dueAt=max(17:00, now+3h)；晚饭次日 07:00；同日多餐合并 | 单元测试覆盖 3 种餐型 dueAt |
| T3-03 每日回访界面 | `components/CheckinCard.tsx` | 到时显示；提交 energy/digestion/satiety；回写 `meals.daily_checkin_id` | 到时出现，提交后消失，checkins 写入，meal 关联成功 |
| T3-04 本地通知（即时反馈提醒） | `utils/notifications.ts`、`schedulePostMealReminder()` | 餐次保存后按 `profile.reminder_delay_min` 延迟推送 | Android 真机收到通知，点击跳转 feedback |
| T3-05 本地通知（每日回访提醒） | `scheduleCheckinReminder(dueAt)` | 到回访时间提醒 | 指定时间 Android 真机收到回访通知 |

## Sprint 4: 历史记录与个人档案

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T4-01 餐次历史日历视图 | `app/history.tsx`、日历视图组件 | 按日期聚合 meals，有记录日期显示色点 | 能看到当月记录，点击日期展开当天餐次列表 |
| T4-01b 美食版图 | 历史页第二个 Tab“菜系地图” | 按 `meal.province` 聚合；SVG 中国省份简化地图；身体拼图口味探索跳转入口 | 记录 2 个不同省份菜系后地图高亮，点击显示餐次列表 |
| T4-02 餐次详情页 | `app/meal-detail.tsx` | 显示餐前图、营养、反馈、回访；未反馈可补录 | 所有已记录字段正确显示，无 null 崩溃 |
| T4-03 历史筛选 | 历史页顶部筛选栏 | 全部/早饭/午饭/晚饭/加餐/未打分 | 筛选后列表和日历同步更新 |
| T4-04 体重记录 | `components/WeightLogger.tsx` | 追加 `weight_logs`；显示趋势；超过 7 天未录入提醒 | `weight_logs` 有时序数据，趋势计算正确 |
| T4-05 个人档案页 | `app/profile.tsx` | 基础信息、目标、健康背景、偏好统计、AI 状态、数据管理 | 所有字段可编辑，修改后 `profiles` 更新 |
| T4-06 数据管理功能 | `confirmClearAllData()`、`confirmDeleteAccount()` | 二次确认，清空本地 SQLite + Supabase 对应数据，注销 auth session | 清空后 `meals` 为空，注销后 session 失效 |

## Sprint 5: 推荐卡与首页逻辑

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T5-01 规则引擎实现 | `services/ai/algorithms/rules.py` | R1 菜系多样性、R2 忌口、R3 健康背景、R4 时段、R5 营养补偿 | 单元测试覆盖 5 条规则和边界情况 |
| T5-02 推荐卡生成接口 | `POST /v1/insight/generate` | 调 rules.py 返回 3 张推荐卡 | 接口格式正确，无相同菜系重复 |
| T5-03 首页推荐卡组件 | `components/RecoCard.tsx` | 接受/跳过写 `card_actions`；记录 dish/badge/risk/action | card_actions 完整，刷新后不重复展示 |
| T5-04 首页状态机 | `stores/useMealStore.ts getHomeScene()` | DEFAULT/PENDING_FB/DONE/CHECKIN_DUE；CHECKIN_DUE 优先级最高 | 4 种状态切换正确，无状态错乱 |
| T5-05 首批洞察生成 | `POST /v1/insight/generate trigger='weekly_first'` | 统计 comfort/energy 负向信号，关联 cuisine/tags，生成 <=3 条洞察 | 有 7 天数据的测试账号首页出现洞察卡片 |
| T5-06 身体拼图初版 | `components/BodyPuzzle.tsx` | 满 7 餐显示整体区域；4 块独立解锁：喜欢吃这个、我的吃法、口味探索、越来越舒服 | 满 7 餐出现；各块独立显示；美食地图跳转正确；数据准确无 null 崩溃 |

## Sprint 6: 稳定性与上线准备

| 任务 | 产出 | 关键逻辑 | 验收 |
|---|---|---|---|
| T6-01 离线同步机制 | `db/sync.ts syncToSupabase()` | 网络恢复批量上传 pending 队列，冲突服务端覆盖 | 断网记录 3 餐，联网后 Supabase 有完整数据 |
| T6-02 网络状态检测 | 离线横幅、恢复 toast | 断网显示顶部红色横幅，联网自动消失 | 关闭 WiFi 出现横幅，开启 WiFi 横幅消失 |
| T6-03 AI 分析失败处理 | 重试界面 | 重试/换图/用模拟结果继续 | 关闭 AI 服务后出现错误界面，三个选项可用 |
| T6-04 性能优化 | FlatList 虚拟化、图片懒加载、数据库查询加索引 | 历史列表性能优化 | 100 条历史记录滚动流畅，首屏 <2 秒 |
| T6-05 Sentry 错误监控 | Sentry 初始化、关键 catch 上报 | 手动测试错误可上报 | Sentry Dashboard 有记录 |
| T6-06 EAS Build 配置 | `eas.json` development/preview/production | EAS preview 构建 | `eas build --profile preview` 成功，APK 可真机安装 |
| T6-07 内测分发 | EAS Submit 或手动分发 APK | 5 台测试设备安装运行 | 无崩溃 |

## 关联验收

见 `docs/acceptance/phase-1-mvp-1-acceptance.md`。
