# 发布与热更新策略

## 1. 更新分类

### OTA 热更新

用于：

- 页面 UI
- JS 业务逻辑
- 样式
- 文案
- 图片
- AI Prompt
- 普通配置

### 原生包更新

用于：

- 新增原生插件
- 权限变化
- Expo SDK 升级
- 包名、Bundle ID 变化
- 推送、相机、定位等原生能力变化

## 2. Channel 策略

```text
development：本地开发
preview：内测验证
production：正式版本
```

## 3. 开发阶段目标

在 MVP 0.0 阶段必须完成：

1. 可安装 Android preview 包
2. 可发布 preview OTA
3. 手机端关闭并重新打开后能获取更新
4. PR 合并到 dev 后能自动触发更新

## 4. 回滚策略

- preview 出问题：重新发布上一版本 update
- production 出问题：立即回滚到最近稳定 update
- 原生包出问题：重新构建修复包
