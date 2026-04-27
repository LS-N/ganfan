# AGENTS.md

## 项目身份

你是《干饭》项目的 AI 开发 Agent。

《干饭》是一款 AI 饮食决策 App，目标是帮助用户记录饮食、判断当天饮食状态，并给出下一餐可执行建议。

本项目不是一次性 Demo，而是长期演进的移动端产品。所有代码和结构必须服务于后续 Android/iOS 双端、热更新、自动化部署、AI 协作开发。

## 当前阶段

当前阶段是：工程入场阶段 + MVP 0.1 准备阶段。

优先级：

1. 先搭建工程底座
2. 再完成可运行空壳 App
3. 再接入 CI/CD 与 EAS Update
4. 最后才进入 MVP 0.1 业务开发

## 技术栈

- App：React Native + Expo
- 语言：TypeScript
- 状态管理：Zustand
- 路由：Expo Router
- 服务端优先方案：Supabase
- 数据库：PostgreSQL
- 样式：React Native StyleSheet + Design Tokens
- 构建发布：Expo EAS Build / EAS Update / EAS Workflows
- 仓库：GitHub

## 禁止事项

- 禁止写死 Android-only 逻辑，除非任务明确要求
- 禁止绕过文档直接发明新页面、新字段、新组件
- 禁止把 UI 样式散落在页面里，必须引用设计 Token
- 禁止直接在代码中写密钥
- 禁止引入重型依赖，除非先说明理由
- 禁止在没有 PRD V1 的情况下开发完整业务闭环
- 禁止跳过测试和验收清单

## 开发顺序

1. 阅读 `START_HERE.md`
2. 阅读 `01_product/product-north-star.md`
3. 阅读 `02_architecture/technical-architecture.md`
4. 阅读 `02_architecture/mobile-platform-strategy.md`
5. 阅读 `02_architecture/release-update-strategy.md`
6. 阅读 `03_prd/mvp-0.1/mvp-0.1-prd-v0-prototype.md`
7. 阅读当前任务文件
8. 输出执行计划
9. 修改代码
10. 运行检查
11. 提交变更说明

## 目录约束

建议代码目录：

```text
app/
src/
  components/
  features/
  screens/
  services/
  stores/
  styles/
  types/
  utils/
docs/
```

文档目录保留：

```text
01_product/
02_architecture/
03_prd/
04_prototype/
05_ai-coding/
06_delivery/
```

## 质量要求

每个任务完成后必须说明：

- 改了哪些文件
- 为什么这样改
- 如何运行
- 如何测试
- 是否影响 Android/iOS
- 是否影响热更新
- 是否需要重新打包

## Review guidelines

- 不记录、不打印用户隐私数据
- 不提交 `.env`
- 所有用户输入都要做基础校验
- 涉及 AI 输出时必须有兜底
- 涉及发布更新时必须区分 preview / production channel
- 涉及原生能力变更时必须标记“需要重新构建 App”
