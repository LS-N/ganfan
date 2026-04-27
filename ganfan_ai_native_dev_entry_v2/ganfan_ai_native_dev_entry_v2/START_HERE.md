# 《干饭》AI Native 开发入场包

## 结论

现在不要直接开发完整 MVP。

正确进入开发的方式是先完成 **工程入场版本**：

> 打通 GitHub → Codex → PR → 自动测试 → EAS Update → 手机端更新 的最小工程流水线。

这一步完成后，再进入 MVP 0.1 业务开发。

## 当前开发决策

- 产品：干饭
- 形态：移动端 App，Android 优先，iOS 预留
- 技术路线：React Native + Expo
- 更新策略：EAS Update 做日常热更新，EAS Build 做原生包构建
- 代码仓库：GitHub
- AI 开发方式：Codex 根据 AGENTS.md + PRD + 任务拆解执行
- 开发铁律：没有 PRD V1，不做完整业务开发

## 第一件事

先让 Codex 执行：

`05_ai-coding/codex-bootstrap-prompt.md`

目标不是做完产品，而是创建可运行、可测试、可 OTA 更新的工程底座。


## 如果本包被上传为外层文件夹

如果 Codex 看到仓库结构类似：

```text
仓库根目录/
└── ganfan_ai_native_dev_entry_v2/
```

则必须先把 `ganfan_ai_native_dev_entry_v2/` 内所有内容迁移到仓库根目录。

最终根目录必须直接包含：

```text
AGENTS.md
README.md
START_HERE.md
package.json
app.json
eas.json
01_product/
02_architecture/
03_prd/
04_prototype/
05_ai-coding/
06_delivery/
docs/
src/
```

不要把整个外层文件夹当作项目根目录。
