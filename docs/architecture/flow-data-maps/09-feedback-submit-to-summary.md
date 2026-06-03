# 流程 09: 反馈提交 → 总结页 → 完成回首页

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 反馈提交-总结页 |
| 触发 | 用户在反馈页（`s-feedback`）点「提交 ✓」按钮 |
| 涉及页面 | `s-feedback` → `s-feedback-summary` → `s-home` |
| 用户耗时 | 提交瞬间 + 总结页停留约 20-60 秒 |
| 入口动作 ID | ㉗ 提交反馈 |
| 出口动作 ID | ㉜ 点完成回首页 |
| 频率估计 | 每餐 1 次（每天 3-5 次） |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 点击「提交 ✓」 | — | `submitFeedback()`: 写入 `meal_feedback`（actualIntake/value, fullness/value, comfort/values, satisfaction/value, taste/value, consumedItems, afterPhotoIntakeRatio）+ `meals` 主表更新（`feedbackAt`, `status='done'`） | — | — |
| 2 | （自动） | — | 快照 `window._prevMealsSnapshot = [...meals]`（pre-submit 状态留底） | — | — |
| 3 | （自动） | — | — | 隐含：下游消费者调 `deriveInsights(meals, 1)` 时自动重算（幂等） | — |
| 4 | 进入总结页 | — | — | 读 `deriveInsights` 中本餐相关 mature/forming 洞察 | `renderFeedbackSummary(m)`: 标题 + 营养结构卡 + 本餐反应预测模块 |
| 5 | 查看总结页 | — | — | — | （只读） |
| 6 | 点击「完成」 | — | 清理 `window._lastSummaryMeal` / `_wasFasting` / `_prevMealsSnapshot` | — | `finishFeedbackSummary()`: `renderHome()` + `show('home')` |
| 7 | （自动） | — | — | `detectNewlyUnlockedPuzzleBlock(meals, prevMeals)` 比对前后拼图块解锁状态 | — |
| 8 | （条件触发：新解锁某块） | — | `localStorage.setItem('puzzle_celebrated_${block}', '1')` | — | `setTimeout(showPuzzleUnlockCelebration(block), 350)` |
| 9 | （自动） | — | — | diff `prevInsights` vs `currInsights`，找 `maturity === 'mature' && !prevMatureIds.has(id)` | — |
| 10 | （条件触发：洞察首次成熟） | — | `localStorage.setItem('insight_celebrated_${insight.id}', '1')` | — | `setTimeout(showBodyMirrorIfReady(insightToBodyMirror(newlyMature)), 350 或 1800)` |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `meal_feedback.actualIntake` (text) | UI 单选 / AI 自动回填（`autoSelectActualIntake`） | 历史详情页展示、周报 |
| `meal_feedback.actualIntakeValue` (number 1.0/0.5/0.2) | 同上对应数值映射 | 营养结构卡精算（饭前估算 × value）、`deriveInsights` 间接参考 |
| `meal_feedback.fullness/value` | UI 单选 | `deriveInsights` 间接、个性化追问触发条件 |
| `meal_feedback.comfort/values` (multi) | UI 多选 | `deriveInsights` reaction 类核心输入 |
| `meal_feedback.satisfaction/value` | UI 单选 | `deriveInsights` preference/avoid 类核心输入 |
| `meal_feedback.taste/value`（个性化追问） | UI 单选 | `deriveInsights` preference 类（DishScore 一次性数据） |
| `meal_feedback.consumedItems[]` | `aiAnalyzeLeftover` AI 输出 | 总结页营养结构卡逐项精算 |
| `meal_feedback.afterPhotoIntakeRatio` | AI 加权均值 | fallback 给营养计算 |
| `meals.feedbackAt` | 系统时间戳 | 拼图块解锁判定 / 时间轴 / 历史日历 |
| `meals.status='done'` | 系统标记 | 首页状态机判断 |
| `insights[*]` 的新样本 | `deriveInsights` 重算输出 | 拼图页 / 抽卡 reason / 总结页本餐预测 / 弹窗 / 时间轴 |
| `localStorage puzzle_celebrated_*` | 解锁庆祝去重 | `finishFeedbackSummary` 检查 |
| `localStorage insight_celebrated_*` | 洞察庆祝去重 | 同上 |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 已有 `pendingAnalysis`（饭前分析完成）+ `mealStartedAt`（用户已确认开吃）+ 反馈页所有必答题已填 + 「提交」按钮启用（`checkCanSubmit()` 通过） |
| 防御 | `scoreSelect` 在每次选择后调用 `checkCanSubmit()` 校验，未填齐则按钮 disabled |
| 降级 | 拍照失败 → 仍可手选 actualIntake；AI leftover 失败 → consumedItems 为 null，营养卡降级用 actualIntakeValue × 饭前估算 |

## 五、洞察影响

### 读取的 insights

| 消费点 | 取的子集 |
|---|---|
| 总结页「本餐反应预测」模块 | filter 本餐 tags 与 insight.triggers 有交集；按 maturity 取最强一条；按 3 档降级文案 |
| 总结页拼图首次解锁庆祝 | 不直接读 insights（**当前架构债**：用 `getUnlockedPuzzleBlockKeys` 自行计算，应迁到 deriveInsights） |
| 「我发现规律」弹窗 | diff prev/curr deriveInsights 找新成熟，取 `insightToBodyMirror(newlyMature)` |

### 写入触发的可能洞察变化

| 写入字段 | 可能影响的 insight angle |
|---|---|
| `comfort` 含「胀气」+ tags 含「油炸」/「主食偏多」 | `reaction.bloated` sampleSize +1，可能 sparse→forming 或 forming→mature |
| `comfort` 含「困倦」+ `meal.type='午饭'` + tags 含「高碳水」 | `reaction.drowsy` 同上 |
| `satisfaction.value > 0` + 有 cuisine | `preference.{cuisine}` sampleSize +1 |
| `satisfaction.value < 0` | `avoid.{cuisine}` sampleSize +1 |
| 餐次时间 21:00+ AND 当天已吃晚饭 | `late_night_eating_reaction` sampleSize +1 |

## 六、架构检查清单

- [✓] 所有 L1 写入都是 append-only：`meal_feedback` 每次提交新增一条（同 meal 重提交在原型阶段未实现修订入口，云端 schema 已支持 history）
- [✓] L2 重算保持幂等：`deriveInsights` 不持久化中间结果，每次从 meals 重算
- [✓] L3 消费层从 L2 取数：总结页洞察、抽卡 reason、个性化追问都走 `deriveInsights`
- [✓] AI 调用如属消费者，prompt 中引用 insights 上下文：本流程无 AI 文案消费者；`aiAnalyzeLeftover` 属生产者，无需引用洞察
- [✓] 弹窗 / 触发类去重通过 localStorage 永久标记：拼图块和洞察成熟弹窗均按 ID 永久去重
- [✓] 数据血缘可追溯：`insights[*].evidence.sourceRefs` 引用 meal.id 完整
- [⚠] **拼图块解锁判定走 L2**：当前 `detectNewlyUnlockedPuzzleBlock` 用独立统计逻辑，未走 deriveInsights → **架构债 P0**

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | 拼图块解锁判定（`getUnlockedPuzzleBlockKeys`）与 deriveInsights 平行，构成第二套"成熟度"判定逻辑 | **P0** | 待立 ##031 修复，把 4 块解锁映射到 deriveInsights 中对应 category 的 mature 数 ≥ 阈值 |

## 八、变更记录

- 2026-05-26 初版（##028-##030 完成后，作为「流程级数据图」首个样板）
