# DevOps 与 CI/CD 规范

## 1. CI 目标

每次 PR 必须自动检查：

- 依赖安装
- TypeScript 类型检查
- Lint
- 测试

## 2. 自动更新策略

### dev 分支

push 到 dev 后，自动发布 preview channel OTA 更新。

### main 分支

main 分支代表稳定版本，不自动发生产更新，生产更新采用手动触发。

### production 更新

通过 GitHub workflow_dispatch 手动触发，避免误发生产。

## 3. 环境

```text
development 本地开发
preview     内测预览
production  正式生产
```

## 4. 密钥

GitHub Secrets：

- EXPO_TOKEN
- SUPABASE_URL
- SUPABASE_ANON_KEY
- OPENAI_API_KEY

任何密钥不得提交到代码仓库。
