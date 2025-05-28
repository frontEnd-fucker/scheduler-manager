import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { UserInit } from '@/components/auth/user-init'
import { getCurrentUser } from '@/app/actions/user-actions'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { User, Mail, Calendar, Database } from 'lucide-react'

export default async function TestUserInitPage() {
  const { userId } = await auth()
  
  if (!userId) {
    redirect('/sign-in')
  }

  // 获取用户信息来验证初始化是否成功
  const userResult = await getCurrentUser()

  return (
    <UserInit>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">用户初始化测试页面</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Clerk 用户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Clerk 用户信息
              </CardTitle>
              <CardDescription>
                来自 Clerk 认证系统的用户信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p><strong>用户 ID:</strong> {userId}</p>
                <p className="text-sm text-gray-600">
                  这是从 Clerk 获取的用户 ID，用作数据库主键
                </p>
              </div>
            </CardContent>
          </Card>

          {/* 数据库用户信息 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-green-600" />
                数据库用户信息
              </CardTitle>
              <CardDescription>
                存储在数据库中的用户信息
              </CardDescription>
            </CardHeader>
            <CardContent>
              {userResult.error ? (
                <div className="text-red-600">
                  <p><strong>错误:</strong> {userResult.error}</p>
                </div>
              ) : userResult.data ? (
                <div className="space-y-2">
                  <p><strong>姓名:</strong> {userResult.data.name || '未设置'}</p>
                  <p><strong>邮箱:</strong> {userResult.data.email}</p>
                  <p><strong>创建时间:</strong> {userResult.data.createdAt.toLocaleString()}</p>
                  <p><strong>更新时间:</strong> {userResult.data.updatedAt.toLocaleString()}</p>
                  <p><strong>课程表数量:</strong> {userResult.data._count.courseTables}</p>
                </div>
              ) : (
                <p className="text-gray-600">正在加载用户信息...</p>
              )}
            </CardContent>
          </Card>

          {/* 用户课程表信息 */}
          {userResult.data && userResult.data.courseTables.length > 0 && (
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  最近的课程表
                </CardTitle>
                <CardDescription>
                  用户最近创建或更新的课程表
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {userResult.data.courseTables.map((table) => (
                    <div key={table.id} className="border rounded-lg p-3">
                      <h4 className="font-medium">{table.name}</h4>
                      <p className="text-sm text-gray-600">
                        创建时间: {table.createdAt.toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        更新时间: {table.updatedAt.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* 测试说明 */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5 text-orange-600" />
                测试说明
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>用户初始化组件的功能：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>检测当前 Clerk 登录用户是否存在于数据库中</li>
                  <li>如果不存在，自动创建新的用户记录</li>
                  <li>如果存在但信息有变化，自动更新用户信息</li>
                  <li>显示相应的状态提示信息</li>
                </ul>
                <p className="mt-4"><strong>测试方法：</strong></p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>首次登录时应该看到"创建新账户"的提示</li>
                  <li>再次访问时应该看到"欢迎回来"的提示</li>
                  <li>在 Clerk 中修改用户信息后，应该看到"信息已更新"的提示</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </UserInit>
  )
} 