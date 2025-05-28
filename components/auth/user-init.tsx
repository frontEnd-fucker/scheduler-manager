import { Suspense } from 'react';
import { initializeUser } from '@/app/actions/user-actions';
import { auth } from '@clerk/nextjs/server';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';

interface UserInitProps {
  children: React.ReactNode;
}

// 用户初始化状态显示组件
function UserInitStatus({ 
  created, 
  updated, 
  userName, 
  error 
}: { 
  created?: boolean; 
  updated?: boolean; 
  userName?: string;
  error?: string;
}) {
  if (error) {
    return (
      <Alert className="mb-4 border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-700">
          用户初始化失败: {error}
        </AlertDescription>
      </Alert>
    );
  }

  if (created) {
    return (
      <Alert className="mb-4 border-green-200 bg-green-50">
        <UserPlus className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-700">
          欢迎！已为用户 <strong>{userName}</strong> 创建新账户
        </AlertDescription>
      </Alert>
    );
  }

  if (updated) {
    return (
      <Alert className="mb-4 border-blue-200 bg-blue-50">
        <RefreshCw className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-700">
          用户信息已更新: <strong>{userName}</strong>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Alert className="mb-4 border-gray-200 bg-gray-50">
      <CheckCircle className="h-4 w-4 text-gray-600" />
      <AlertDescription className="text-gray-700">
        欢迎回来，<strong>{userName}</strong>
      </AlertDescription>
    </Alert>
  );
}

// 内部初始化组件
async function UserInitializer({ children }: UserInitProps) {
  const { userId } = await auth();
  
  // 如果用户未认证，直接渲染子组件
  if (!userId) {
    return <>{children}</>;
  }

  // 执行用户初始化
  const result = await initializeUser();
  
  const showStatus = result.created || result.updated || result.error;
  
  return (
    <>
      {showStatus && (
        <UserInitStatus
          created={result.created}
          updated={result.updated}
          userName={result.data?.name || result.data?.email}
          error={result.error}
        />
      )}
      {children}
    </>
  );
}

// 主组件，带有 Suspense 包装
export function UserInit({ children }: UserInitProps) {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center p-4">
          <div className="flex items-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span className="text-sm text-gray-600">正在初始化用户...</span>
          </div>
        </div>
      }
    >
      <UserInitializer>{children}</UserInitializer>
    </Suspense>
  );
} 