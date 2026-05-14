# Phase 0: Sprint 0 工程底座与基础组件库

来源：`docs/02-master-blueprint.md` 第 1819-1917 行。

本文件是蓝图任务映射，不得改写任务编号。开发时只能在对应任务下补充执行说明，不能新增脱离蓝图的任务。

## 本阶段必须引用的蓝图章节

开发 Phase 0 前必须同时读取 `docs/02-master-blueprint.md` 中这些章节：

- `总体架构设计`：确认目标仓库结构和长期架构方向。
- `最终技术栈`：确认 Expo、React Native、TypeScript、Zustand、pnpm 等基础选型。
- `仓库结构（完整）`：判断当前根目录 Expo 过渡结构与目标 monorepo 的差异。
- `UI 设计系统`：色彩、字体、间距、圆角、基础组件样式规范。
- `核心 TypeScript 类型`：避免基础类型和后续业务类型脱节。
- `Zustand Store 接口定义`：避免基础状态设计与后续 store 冲突。
- `架构原则`、`文件命名`：目录、命名、分层约束。
- `环境变量规范`：`.env.example` 只能放示例，不得放真实密钥。
- `CI/CD 流水线`：lint、typecheck、test、EAS/部署流水线边界。

不得把本章节内容复制成新的权威；如有冲突，以 `docs/02-master-blueprint.md` 为准。

## 阶段目标

搭建可运行的工程环境，建立主题系统和所有基础组件，后续 Sprint 直接复用。

## 周期与完成判定

- 周期：1 Sprint，2 周。
- 完成判定：App 在模拟器运行，组件预览页展示所有基础组件的所有状态，无 TypeScript 错误。

## Sprint 0: 工程初始化

| 任务 | 产出 | 验收 |
|---|---|---|
| T0-00a 初始化 Monorepo | `ganfan/` 目录结构、`pnpm-workspace.yaml`、根 `package.json` | `pnpm install` 无报错 |
| T0-00b 初始化 Expo App | `apps/mobile/` 完整 Expo + TypeScript 项目 | `npx expo start` 在模拟器显示空白界面 |
| T0-00c 配置 Expo Router + TabBar | `app/(tabs)/_layout.tsx`，4 个 Tab：首页 / 记录 / 历史 / 我 | 4 个 Tab 可切换，无报错，tabbar 吸底显示 |

以上三步是组件开发前置。当前仓库仍处于根目录 Expo App 过渡结构；如果不迁移 monorepo，必须在任务记录中说明与蓝图目标结构的差异和用户确认结果。

## Sprint 0: 主题与组件基础

| 任务 | 产出 | 验收 |
|---|---|---|
| T0-01 主题系统 | `src/theme/colors.ts`、`src/theme/typography.ts`、`src/theme/spacing.ts`、`src/theme/index.ts` | 所有 token 可从 `@/theme` 导入，无硬编码颜色/数字散落在组件中 |
| T0-02 布局组件 | `src/components/layout/NavBar.tsx`、`TabBar.tsx`、`PageContainer.tsx`、`Section.tsx` | 四个组件渲染正确，符合设计规范尺寸 |
| T0-03 卡片与容器组件 | `src/components/base/Card.tsx`、`CardSoft.tsx`、`Sheet.tsx` | Card 白底 border，CardSoft cream 背景，Sheet 动画正确 |
| T0-04 按钮组件 | `PrimaryButton.tsx`、`GhostButton.tsx`、`OutlineButton.tsx`、`IconButton.tsx` | PrimaryButton loading 显示 spinner；disabled 透明度 0.4；所有按钮有 press 反馈 |
| T0-05 选择控件 | `ScoreButton.tsx`、`OnboardingOption.tsx`、`SegmentTabs.tsx` | 选中状态颜色切换正确，SegmentTabs 滑块动画流畅 |
| T0-06 展示组件 | `Label.tsx`、`Chip.tsx`、`RiskBar.tsx`、`AdviceBox.tsx`、`MealItemRow.tsx`、`DayDot.tsx`、`ProgressBar.tsx` | 所有变体在预览页可见 |
| T0-07 反馈与状态组件 | `Toast.tsx` + `useToast()`、`EmptyState.tsx`、`LoadingSpinner.tsx`、`UploadZone.tsx` | `Toast.show('xxx')` 底部弹出后自动消失；EmptyState 居中布局正确 |
| T0-08 组件预览页 | `app/dev/components.tsx`，仅开发环境注册 | 开发模式可访问 `/dev/components`，看到所有基础组件渲染结果 |

## 非目标

- 不实现 MVP 1.0 业务闭环。
- 不接真实 Supabase、FastAPI、AI secret。
- 不创建生产数据库 migration，除非用户明确批准。

## 关联验收

见 `docs/acceptance/phase-0-acceptance.md`。
