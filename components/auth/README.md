# 用户初始化组件

这个目录包含了用于检测和初始化 Clerk 用户的组件。

## 组件介绍

### UserInit (Server Component)
服务端组件版本，推荐在 Server Components 中使用。

**特点：**
- 在服务端执行用户检查和创建
- 更好的性能和 SEO
- 直接使用 Clerk 的 server-side API
- 自动处理用户信息同步

**使用方法：**
```tsx
import { UserInit } from '@/components/auth/user-init';

export default async function DashboardPage() {
  return (
    <UserInit>
      <div>你的页面内容</div>
    </UserInit>
  );
}
```

### UserInitClient (Client Component)
客户端组件版本，适合在需要客户端交互的场景使用。

**特点：**
- 在客户端执行用户初始化
- 提供更丰富的交互反馈
- 适合复杂的用户界面场景
- 通过 API 路由进行用户操作

**使用方法：**
```tsx
'use client';

import { UserInitClient } from '@/components/auth/user-init-client';

export default function ClientPage() {
  return (
    <UserInitClient>
      <div>你的页面内容</div>
    </UserInitClient>
  );
}
```

## 功能说明

### 自动用户检测和创建
- 检测当前登录的 Clerk 用户是否存在于数据库中
- 如果不存在，自动创建新用户记录
- 如果存在但信息有变化，自动更新用户信息

### 用户信息同步
- 同步 Clerk 用户的邮箱地址
- 同步用户的姓名信息（firstName + lastName）
- 支持用户信息的增量更新

### 状态反馈
- 新用户创建成功提示
- 用户信息更新提示
- 欢迎回来消息
- 错误处理和提示

## API 路由

### POST /api/user/init
用于客户端组件的用户初始化。

**请求体：**
```json
{
  "userId": "string (可选)",
  "email": "string (可选)",
  "name": "string (可选)"
}
```

**响应：**
```json
{
  "data": {
    "id": "string",
    "email": "string", 
    "name": "string",
    "createdAt": "datetime",
    "updatedAt": "datetime"
  },
  "created": "boolean",
  "updated": "boolean"
}
```

### GET /api/user/init
获取当前用户信息及关联的课程表。

## 最佳实践

1. **优先使用 Server Component 版本**：在大多数情况下，推荐使用 `UserInit` 组件，因为它性能更好。

2. **在 layout 或页面入口使用**：将用户初始化组件放在应用的入口位置，确保用户进入系统时就完成初始化。

3. **错误处理**：组件内置了错误处理，但建议在应用层面也要有相应的错误边界。

4. **用户体验**：组件提供了加载状态和结果反馈，确保用户了解系统状态。

## 技术细节

- 使用 Prisma 进行数据库操作
- 集成 Clerk 的服务端和客户端 API
- 使用 Zod 进行数据验证
- 支持 TypeScript
- 遵循 Next.js 13+ App Router 最佳实践 