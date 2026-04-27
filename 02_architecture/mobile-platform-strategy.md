# 移动端平台策略

## 1. 平台目标

当前优先：Android  
后续支持：iOS

技术策略：用 React Native + Expo 保证双端共用主体代码。

## 2. Android 当前策略

- 先支持 Android 内测包
- 通过 EAS Update 做日常更新
- 使用 preview channel 验证
- 稳定后再进入 production channel

## 3. iOS 预留策略

从第一天开始避免 Android-only 设计：

- 不写死 Android 权限
- 不使用仅 Android 可用的组件方案
- 页面布局按双端适配
- 原生能力必须先确认双端支持

## 4. 需要重新打包的情况

以下情况不能只靠热更新：

- 新增或修改原生权限
- 新增原生插件
- 修改 app.json 中影响原生工程的配置
- 修改 bundle identifier / package name
- 升级 Expo SDK
- 改变推送、相机、定位等原生能力

## 5. 可以热更新的情况

- 页面样式
- 页面逻辑
- JS/TS 业务代码
- 文案
- 图片资源
- 非原生配置
- AI Prompt 规则
