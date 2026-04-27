# 技术架构总文档

## 1. 架构目标

本架构服务于三个目标：

1. Android 优先上线
2. iOS 后续低成本扩展
3. 开发阶段可通过 OTA 热更新快速迭代

## 2. 技术路线

- 移动端：React Native + Expo
- 语言：TypeScript
- 路由：Expo Router
- 状态管理：Zustand
- 后端：Supabase 优先
- 数据库：PostgreSQL
- AI 服务：独立 AI Service 层
- 构建：EAS Build
- 热更新：EAS Update
- 自动化：GitHub Actions / EAS Workflows
- AI 开发：Codex + AGENTS.md + PR

## 3. 总体架构

```text
用户手机 App
→ React Native 页面层
→ Feature 业务模块
→ Service API 层
→ Supabase / API Server
→ PostgreSQL
→ AI Service
→ 埋点分析
```

## 4. 分层原则

### Page 层

只负责页面组合和跳转。

### Component 层

只负责通用 UI 组件。

### Feature 层

负责业务模块，例如 meal、profile、advice。

### Service 层

负责接口调用、AI 调用、数据读写。

### Store 层

负责前端状态。

### Types 层

负责全局类型定义。

## 5. 目录建议

```text
app/
  _layout.tsx
  index.tsx
  record.tsx
  history.tsx
  profile.tsx

src/
  components/
  features/
    meal/
    advice/
    profile/
  services/
    supabase/
    ai/
  stores/
  styles/
  types/
  utils/
```

## 6. 开发边界

MVP 0.0 只做工程底座。

MVP 0.1 才做饮食记录闭环。

在没有原型确认和 PRD V1 前，不进入完整业务开发。
