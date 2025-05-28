# 用户初始化组件使用示例

## 1. 在 Dashboard 页面中使用 (推荐)

```tsx
// app/dashboard/page.tsx
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserInit } from '@/components/auth/user-init'

export default async function DashboardPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  return (
    <UserInit>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">欢迎来到仪表板</h1>
        {/* 你的页面内容 */}
      </div>
    </UserInit>
  )
}
```

## 2. 在 Layout 中使用 (全局初始化)

```tsx
// app/dashboard/layout.tsx
import { UserInit } from '@/components/auth/user-init'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <UserInit>
      <div className="min-h-screen bg-gray-50">
        <nav>{/* 导航栏 */}</nav>
        <main>{children}</main>
      </div>
    </UserInit>
  )
}
```

## 3. 在客户端组件中使用

```tsx
// app/profile/page.tsx
'use client'

import { UserInitClient } from '@/components/auth/user-init-client'
import { useUser } from '@clerk/nextjs'

export default function ProfilePage() {
  const { user } = useUser()

  return (
    <UserInitClient>
      <div className="container mx-auto px-4 py-8">
        <h1>用户资料</h1>
        {user && (
          <div>
            <p>姓名: {user.firstName} {user.lastName}</p>
            <p>邮箱: {user.emailAddresses[0]?.emailAddress}</p>
          </div>
        )}
      </div>
    </UserInitClient>
  )
}
```

## 4. 条件性用户初始化

```tsx
// app/settings/page.tsx
import { auth } from '@clerk/nextjs/server'
import { UserInit } from '@/components/auth/user-init'

export default async function SettingsPage() {
  const { userId } = await auth()

  // 只有登录用户才需要初始化
  if (!userId) {
    return (
      <div className="text-center py-8">
        <p>请先登录以访问设置页面</p>
      </div>
    )
  }

  return (
    <UserInit>
      <div className="container mx-auto px-4 py-8">
        <h1>用户设置</h1>
        {/* 设置内容 */}
      </div>
    </UserInit>
  )
}
```

## 5. 与错误边界结合使用

```tsx
// app/dashboard/error.tsx
'use client'

import { useEffect } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-4 py-8">
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          用户初始化失败: {error.message}
        </AlertDescription>
      </Alert>
      <button
        onClick={reset}
        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        重试
      </button>
    </div>
  )
}
```

## 6. 自定义状态处理

```tsx
// components/custom-user-init.tsx
import { Suspense } from 'react'
import { UserInit } from '@/components/auth/user-init'
import { Loader2 } from 'lucide-react'

interface CustomUserInitProps {
  children: React.ReactNode
  loadingMessage?: string
}

export function CustomUserInit({ 
  children, 
  loadingMessage = "正在初始化用户..." 
}: CustomUserInitProps) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen">
          <div className="flex items-center space-x-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>{loadingMessage}</span>
          </div>
        </div>
      }
    >
      <UserInit>{children}</UserInit>
    </Suspense>
  )
}
```

## 7. API 路由的使用示例

```tsx
// 在客户端组件中手动调用用户初始化
'use client'

import { useState } from 'react'

export function ManualUserInit() {
  const [status, setStatus] = useState<string>('')

  const initializeUser = async () => {
    setStatus('正在初始化...')
    
    try {
      const response = await fetch('/api/user/init', {
        method: 'POST',
      })
      
      const result = await response.json()
      
      if (response.ok) {
        if (result.created) {
          setStatus('用户创建成功！')
        } else if (result.updated) {
          setStatus('用户信息已更新！')
        } else {
          setStatus('用户已存在')
        }
      } else {
        setStatus(`错误: ${result.error}`)
      }
    } catch (error) {
      setStatus('网络错误')
    }
  }

  return (
    <div>
      <button onClick={initializeUser}>手动初始化用户</button>
      {status && <p>{status}</p>}
    </div>
  )
}
```

## 8. 与 React Query 结合使用

```tsx
// hooks/useUserInit.ts
'use client'

import { useQuery } from '@tanstack/react-query'

export function useUserInit() {
  return useQuery({
    queryKey: ['user-init'],
    queryFn: async () => {
      const response = await fetch('/api/user/init', {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('用户初始化失败')
      }
      
      return response.json()
    },
    staleTime: 5 * 60 * 1000, // 5分钟
    retry: 3,
  })
}

// 在组件中使用
export function UserProfile() {
  const { data, isLoading, error } = useUserInit()

  if (isLoading) return <div>正在初始化用户...</div>
  if (error) return <div>初始化失败: {error.message}</div>

  return (
    <div>
      <h1>用户资料</h1>
      {data?.created && <p>欢迎新用户！</p>}
      {data?.updated && <p>信息已更新</p>}
    </div>
  )
}
```

## 最佳实践总结

1. **优先使用 Server Component 版本** (`UserInit`) 以获得更好的性能
2. **在应用入口处使用** 确保用户进入系统时就完成初始化
3. **结合错误边界** 处理初始化失败的情况
4. **提供加载状态** 让用户了解系统正在处理
5. **合理使用缓存** 避免重复的初始化请求 