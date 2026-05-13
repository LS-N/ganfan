# API 规范

## 1. 用户资料

### GET /profile

获取用户资料。

### PUT /profile

更新用户资料。

## 2. 饮食记录

### GET /meals/today

获取今日饮食记录。

### POST /meals

新增饮食记录。

### GET /meals/:id

获取饮食详情。

### PUT /meals/:id

更新饮食记录。

### DELETE /meals/:id

删除饮食记录。

### GET /meals/history

获取历史记录。

## 3. AI 服务

### POST /ai/meal-analyze

分析单餐饮食。

### POST /ai/next-meal-advice

生成下一餐建议。

## 4. 统一响应结构

```ts
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```
