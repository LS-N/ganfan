# 流程 07: 拍照 → AI 分析 → 修正 → 确认开吃

## 一、流程基本信息

| 字段 | 内容 |
|---|---|
| 流程名 | 拍照与饭前分析 |
| 触发 | 抽卡后进入 / 首页直接点拍照入口 |
| 涉及页面 | `s-camera` |
| 用户耗时 | 约 30-90 秒（拍照 + AI 等待 + 浏览） |
| 入口动作 ID | ⑲ 拍照 / 选图 |
| 出口动作 ID | ㉑ 确认开吃 |
| 频率估计 | 每餐 1 次 |

## 二、四层泳道图

| # | USER | AI 生产 | Layer 1 写入 | Layer 2 触发 | Layer 3 渲染 |
|---|---|---|---|---|---|
| 1 | 选餐次（早/午/晚/加餐） | — | `camMealType = '...'` 临时 | — | UI 反映 |
| 2 | 调起相机/相册 | — | — | — | ActionSheet |
| 3 | 拍照 / 选图 | — | `wideImg` 临时持有 | — | 上传预览 |
| 4 | （自动）AI 分析 | `aiAnalyzeMeal(imageUrl, userProfile, mealHistory)` 调 PROMPT_MEAL_ANALYSIS，输出 dish/cuisine/tags/nutritionEstimate/recognizedFoods/eatingAdvice | — | — | spinner 动画 |
| 5 | 看分析结果 | — | `pendingAnalysis = result` 临时 | — | `renderAnalysis()`：5 块结构 |
| 6 | （可选）修改菜名/营养 | — | `meal_corrections` 写入 `{field, ai_value, user_value, timestamp}` append-only | — | 分析卡更新 |
| 7 | 点「好的，去吃了」 | — | `meals` 主表新增：dish/cuisine/province/analysis/wideImg/`mealStartedAt`/from_card（如果有）；`activePendingMealId` 持有；`meal_images` 写 image_type='wide' | — | `renderHome()` PENDING_FEEDBACK 状态 |
| 8 | 自动调度提醒 | — | `schedulePostMealReminder(profile.reminder_delay_min)` | — | 系统通知 |

## 三、数据血缘

| 写入字段 | 来源 | 被哪些消费者消费 |
|---|---|---|
| `meal_images.storage_url + image_type='wide'` | 用户拍照 | 分析页展示 / 后续 leftover 对比 |
| `meal_analysis.dish/cuisine/province/scene` | AI 输出 | 历史记录 / 菜系地图 / 抽卡参考 |
| `meal_analysis.recognizedFoods[]` | AI 输出 | 营养计算 / 饭后对比的食物列表 |
| `meal_analysis.tags[]` | AI 输出 | deriveInsights 的 reaction triggers 匹配 |
| `meal_analysis.nutritionEstimate` | AI + 营养库匹配 | 营养结构卡 |
| `meal_analysis.eatingAdvice` | AI 输出 | 分析页建议块 |
| `meal_corrections[]` | 用户修正 | **当前只存不用**（架构债：未反哺识别准确率） |
| `meals.mealStartedAt` | 系统时间 | 进食时长计算 / 30 分钟超时判定 |
| `meals.from_card` | 抽卡来源（如有） | 历史溯源 / 抽卡命中率分析 |

## 四、触发条件

| 类型 | 条件 |
|---|---|
| 前置 | 不能有待反馈餐（如有，需先反馈或加餐路径） |
| 防御 | AI 失败 → 重试 / 换图 / mock 结果三个选项 |
| 降级 | 无 AI key → 使用 mockAnalysis() |

## 五、洞察影响

### 读取的 insights
- AI prompt 包含 mealHistory 摘要（不是 insights，是原始 meals）
- 当前 aiAnalyzeMeal **未明确注入 insights 上下文**（不像 aiGenerateCards 做了硬约束）

### 写入触发的可能洞察变化
- 本流程的 L1 写入要等到流程 09 提交反馈时才影响洞察
- meal_analysis.tags 是后续 deriveInsights reaction 类的触发词来源

## 六、架构检查清单

- [✓] L1 写入 append-only：meal_analysis 和 meal_corrections 都是新增
- [N/A] L2 重算：本流程不触发
- [✓] L3 消费层从 L2 取数：分析页 eatingAdvice 来自 AI（属生产者，不消费 insights）
- [⚠] AI 调用引用 insights：`aiAnalyzeMeal` prompt **未注入 insights 上下文**（潜在改进点）
- [N/A] 去重
- [✓] 数据血缘：meal_analysis 关联 meal_id，corrections 关联具体字段
- [⚠] `meal_corrections.diff` 字段 schema 不严格（应统一 `{field, ai_value, user_value, timestamp}` 格式）

## 七、已知架构债

| # | 债 | 优先级 | 关联 |
|---|---|---|---|
| 1 | `meal_corrections` 存了但未反哺 AI 识别准确率 | P2 | Phase 2+ 训练数据 |
| 2 | `aiAnalyzeMeal` prompt 未注入 insights（如用户已知偏好/忌口） | P2 | 与 ##030 抽卡 prompt 同模式但本流程未做 |
| 3 | `mealDurationMs` 字段已记录但无消费者使用 | P2 | Phase 2+ 计算饱腹时长规律 |

## 八、变更记录

- 2026-05-26 初版
