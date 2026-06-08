# 干饭 · UI 系统

> 管：色彩/字体/间距/圆角 token + 基础组件规范 + 复合组件清单。不管：原型 HTML 实现（→ docs/prototype/）、TypeScript 类型（→ type-architecture.md）。
> **唯一真相源**：src/theme/ 下的 token 文件与本文档必须严格一一对应，修改 token 必须同步更新本文档。

---

## 一、定位与边界

本文档是干饭项目 UI 设计系统的规范文档，覆盖从视觉 token（色彩、字体、间距、圆角）到基础组件样式规范的全部内容。

- **纳入范围**：token 定义、基础组件清单与样式规范、复合组件清单
- **排除范围**：原型 HTML/CSS 实现（见 docs/prototype/）、React Native 组件代码实现、TypeScript 业务类型（见 type-architecture.md）

---

## 二、核心原则

1. 不硬编码颜色/间距——必须通过 token 引用
2. 设计-代码同源——主原型（docs/prototype/）的 CSS variables 与 src/theme/ 必须对应
3. 字体只用 sans 和 serif 两种
4. 复合组件按 Phase 实现，基础组件 Phase 0 全实现
5. token 变更必须同步更新本文档

---

## 三、架构内容

### 3.1 色彩 Token

```typescript
// src/theme/colors.ts
export const colors = {
  // 背景层次
  cream:    '#FAF7F2',   // 页面背景
  white:    '#FFFEF9',   // 卡片/组件背景

  // 文字层次
  ink:      '#1A1612',   // 主文字
  ink60:    '#7A6E66',   // 次要文字
  ink30:    '#C5BDB5',   // 占位/禁用文字

  // 边框
  border:   '#EDE8E1',

  // 主色（橙红，行动/激活状态）
  accent:   '#E85D26',
  accentS:  '#FFF0E9',   // accent 浅底

  // 辅色（绿，正向/健康）
  green:    '#2D6A4F',
  greenS:   '#EBF5EF',

  // 警示色（琥珀，注意/提醒）
  amber:    '#D4860A',
  amberS:   '#FEF6E4',

  // 危险色
  red:      '#C0392B',
  redS:     '#FDECEA',
}
```

### 3.2 字体规范

```typescript
// src/theme/typography.ts
export const fonts = {
  sans:  "-apple-system, BlinkMacSystemFont, 'PingFang SC', 'Helvetica Neue', sans-serif",
  serif: "Georgia, 'Songti SC', serif",
}

// 字号用途对照
// serif 36px  → 首页大标题（hero-title）
// serif 22-24px → 页面标题、身体拼图标题
// serif 20px  → 弹窗标题
// sans  19px  → NavBar 标题（nav-title）
// sans  15-16px → 正文、按钮
// sans  14px  → 说明文字、建议文字
// sans  13px  → 辅助信息、标签
// sans  12px  → chip、小标签
// sans  11px  → LABEL 大写标题（section header）
// sans  10px  → TabBar 文字
```

### 3.3 间距 & 圆角

```typescript
// src/theme/spacing.ts
export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
  page: 20,   // 页面左右边距
}

export const radius = {
  sm:   10,   // --rs: 小组件（chip、分析框、小卡片）
  md:   16,   // --r: 标准卡片
  lg:   20,   // 弹窗、底部 sheet
  full: 999,  // 胶囊按钮、tag
}
```

### 3.4 基础组件清单

**布局组件：**

| 组件 | 规范 |
|------|------|
| `NavBar` | 高56px，背景white，底border，标题serif 19px居中，左右各一个操作区 |
| `TabBar` | 高58px（含bottom safe area），背景white，顶border，4 tab，激活accent色 |
| `PageContainer` | 背景cream，paddingHorizontal 20，paddingTop 16 |
| `Section` | margin-bottom 12，子卡片间距8 |

**卡片 & 容器：**

| 组件 | 规范 |
|------|------|
| `Card` | 背景white，border 1px border色，radius 16，padding 18，marginBottom 12 |
| `CardSoft` | 背景cream，无border，radius 16，padding 14（用于嵌套内容区） |
| `Sheet` | 底部滑出弹窗，背景white，radius top 20，padding 28 24，max-height 80vh |

**按钮：**

| 组件 | Props | 规范 |
|------|-------|------|
| `PrimaryButton` | label, onPress, loading, disabled | 背景accent，白字，radius full，height 52，fontSize 15，fontWeight 500，全宽 |
| `GhostButton` | label, onPress | 透明背景，ink60色，fontSize 14，marginTop 8 |
| `OutlineButton` | label, onPress, color | border 1.5px，指定color，radius full，padding 11，fontSize 13 fontWeight 600 |
| `IconButton` | icon, onPress | border 1px border色，背景white，radius full，padding 7 10，fontSize 12 |

**选择控件：**

| 组件 | Props | 规范 |
|------|-------|------|
| `ScoreButton` | label, selected, onPress | border 1.5px，radius 10，高度自适应，未选border/white/ink60，选中accent-s背景+accent字+accent边框 |
| `OnboardingOption` | label, description?, selected, onPress | border 1.5px，radius 10，padding 13 16，fontSize 15，选中同ScoreButton |
| `SegmentTabs` | tabs[], activeIndex, onChange | 背景cream，内部激活项白背景+shadow，radius full |

**展示组件：**

| 组件 | 规范 |
|------|------|
| `Label` | fontSize 11，fontWeight 600，uppercase，letterSpacing 0.07em，ink60色，marginBottom 10 |
| `Chip` | padding 3 10，radius full，fontSize 12，fontWeight 500；green变体/amber变体 |
| `RiskBar` | height 3，radius 2；low=green 33%，medium=amber 66%，high=red 100% |
| `AdviceBox` | 背景accent-s，radius 10，padding 14，fontSize 14，accent色文字，lineHeight 1.6 |
| `MealItemRow` | flex row，高度自适应，padding 13 0，底border；左42px圆角头像区，右文字区 |
| `DayDot` | 28×28，radius 50%；默认border色，done=accent背景，today=accent边框 |
| `Toast` | fixed底部80px，背景ink，白字，radius full，padding 10 20，fontSize 13，动画淡入淡出 |
| `UploadZone` | dashed border 2px，radius 16，padding 28 20，背景cream；有图时显示 cover 图 |
| `EmptyState` | 居中布局，emoji大图，serif标题，ink60说明，可选操作按钮 |
| `LoadingSpinner` | 48px emoji spin动画，2s linear infinite |
| `ProgressBar` | height 3，radius 2，背景border，激活色可配置 |

### 3.5 复合组件清单（页面专用，按 Phase 实现）

| 组件 | 说明 | Phase |
|---|---|---|
| MealCard | 餐次列表卡片 | 1 |
| RecoCard | 推荐卡 | 1 |
| BodyPuzzle | 身体拼图 4 块 | 1 |
| NutritionBar | 营养进度条 | 1 |
| WeightChart | 体重趋势图 | 3 |
| ProvinceMap | 省级 SVG 地图（基于 ECharts GeoJSON）| 1 |

---

## 四、Phase 演进

- **Phase 0**：基础组件库全实现（24 个基础组件）
- **Phase 1**：复合组件按 Sprint 实现（MealCard/RecoCard/BodyPuzzle/NutritionBar/ProvinceMap）
- **Phase 3+**：WeightChart 等随数据模块上线

---

## 五、禁止事项

- 禁止业务代码中硬编码颜色值（如 `'#E85D26'`）
- 禁止超出 token 范围用色
- 禁止在组件内部自定义间距数值（必须用 `spacing.*` token）
- 禁止改 token 不同步更新本文档

---

## 六、变更记录

| 日期 | 任务编号 | 变更 |
|---|---|---|
| 2026-06-03 | ##045 | 初版落盘，从蓝图 L1929-L2069 迁出 |
