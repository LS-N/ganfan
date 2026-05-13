# 安全与环境变量规范

## 1. 基本原则

- 不把密钥写进代码
- 不把 `.env` 提交到仓库
- 前端只允许使用可公开的 anon key
- 服务端密钥必须放在服务端或云函数环境变量中

## 2. 环境变量

```text
EXPO_PUBLIC_APP_ENV
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
OPENAI_API_KEY
SENTRY_DSN
```

## 3. AI 调用安全

前端不直接暴露高权限 AI Key。

建议：

```text
App
→ API / Edge Function
→ AI Provider
```

## 4. 用户隐私

MVP 阶段不要采集不必要的敏感信息。

体重、目标体重等数据只用于饮食目标计算，不用于无关分析。
