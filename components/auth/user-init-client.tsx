'use client';

import { useUser } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertCircle, UserPlus, RefreshCw } from 'lucide-react';

interface UserInitClientProps {
  children: React.ReactNode;
}

interface InitResult {
  success: boolean;
  created?: boolean;
  updated?: boolean;
  userName?: string;
  error?: string;
}

export function UserInitClient({ children }: UserInitClientProps) {
  const { user, isLoaded } = useUser();
  const [initResult, setInitResult] = useState<InitResult | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  useEffect(() => {
    const initializeUser = async () => {
      if (!isLoaded || !user) return;
      
      setIsInitializing(true);
      
      try {
        const response = await fetch('/api/user/init', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: user.firstName && user.lastName 
              ? `${user.firstName} ${user.lastName}` 
              : user.firstName || user.lastName || null,
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setInitResult({
            success: true,
            created: result.created,
            updated: result.updated,
            userName: result.data?.name || result.data?.email,
          });
        } else {
          setInitResult({
            success: false,
            error: result.error || '用户初始化失败',
          });
        }
      } catch (error) {
        console.error('User initialization error:', error);
        setInitResult({
          success: false,
          error: '网络错误，请重试',
        });
      } finally {
        setIsInitializing(false);
      }
    };

    initializeUser();
  }, [user, isLoaded]);

  // 如果用户未登录，直接渲染子组件
  if (!isLoaded || !user) {
    return <>{children}</>;
  }

  // 显示初始化状态
  const renderStatus = () => {
    if (isInitializing) {
      return (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
          <AlertDescription className="text-blue-700">
            正在初始化用户信息...
          </AlertDescription>
        </Alert>
      );
    }

    if (initResult?.error) {
      return (
        <Alert className="mb-4 border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-700">
            {initResult.error}
          </AlertDescription>
        </Alert>
      );
    }

    if (initResult?.created) {
      return (
        <Alert className="mb-4 border-green-200 bg-green-50">
          <UserPlus className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700">
            欢迎！已为用户 <strong>{initResult.userName}</strong> 创建新账户
          </AlertDescription>
        </Alert>
      );
    }

    if (initResult?.updated) {
      return (
        <Alert className="mb-4 border-blue-200 bg-blue-50">
          <RefreshCw className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-700">
            用户信息已更新: <strong>{initResult.userName}</strong>
          </AlertDescription>
        </Alert>
      );
    }

    if (initResult?.success) {
      return (
        <Alert className="mb-4 border-gray-200 bg-gray-50">
          <CheckCircle className="h-4 w-4 text-gray-600" />
          <AlertDescription className="text-gray-700">
            欢迎回来，<strong>{initResult.userName}</strong>
          </AlertDescription>
        </Alert>
      );
    }

    return null;
  };

  return (
    <>
      {renderStatus()}
      {children}
    </>
  );
} 