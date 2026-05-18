# Phase 0 / Sprint 0 验收清单

来源：`docs/02-master-blueprint.md` 第 1819-1917 行。

任何 Phase 0 任务结束前，必须逐条标记 `PASS` / `PARTIAL` / `FAIL` / `N/A`，并写入 `docs/TASK_LOG.md`。

## 阶段完成判定

- [ ] App 在模拟器运行。
- [ ] 组件预览页展示所有基础组件的所有状态。
- [ ] 无 TypeScript 错误。

## 任务级验收

| 任务 | 验收项 |
|---|---|
| T0-00a 初始化 Monorepo | `pnpm install` 无报错；存在蓝图要求的 monorepo 根结构，或有用户确认的过渡结构说明 |
| T0-00b 初始化 Expo App | Expo + TypeScript 项目可运行；`npx expo start` 能在模拟器显示空白界面或当前 App 首屏 |
| T0-00c 配置 Expo Router + TabBar | 4 个 Tab：首页 / 记录 / 历史 / 我可切换，无报错，tabbar 吸底显示 |
| T0-01 主题系统 | `colors`、`typography`、`spacing`、`index` 可从 `@/theme` 统一导入；组件中无无解释的硬编码颜色/数字 |
| T0-02 布局组件 | `NavBar`、`TabBar`、`PageContainer`、`Section` 渲染正确，符合设计规范尺寸 |
| T0-03 卡片与容器组件 | `Card` 白底 border；`CardSoft` cream 背景；`Sheet` 底部滑出动画正确 |
| T0-04 按钮组件 | `PrimaryButton` loading 显示 spinner；disabled 透明度 0.4；所有按钮有 press 反馈 |
| T0-05 选择控件 | `ScoreButton`、`OnboardingOption` 选中状态正确；`SegmentTabs` 滑块动画流畅 |
| T0-06 展示组件 | `Label`、`Chip`、`RiskBar`、`AdviceBox`、`MealItemRow`、`DayDot`、`ProgressBar` 所有变体在预览页可见 |
| T0-07 反馈与状态组件 | `Toast.show('xxx')` 底部弹出后自动消失；`EmptyState` 居中布局正确；`LoadingSpinner` 和 `UploadZone` 可见 |
| T0-08 组件预览页 | 开发模式可访问 `/dev/components`，看到所有基础组件所有状态 |

## 必跑命令

```powershell
npm run lint
npm run typecheck
npm test
```

如任务涉及启动验证，补充：

```powershell
npm run web
```

## 阻断条件

- 存在真实密钥。
- 基础组件不可复用，后续页面必须重复定义基础样式。
- TypeScript 或 lint 不通过。
